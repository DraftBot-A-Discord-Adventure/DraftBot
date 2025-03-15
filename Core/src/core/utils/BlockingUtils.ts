import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {BlockedPacket} from "../../../../Lib/src/packets/commands/BlockedPacket";
import Player, {Players} from "../database/game/models/Player";
import {BlockingConstants, BlockingReason} from "../../../../Lib/src/constants/BlockingConstants";
import {ChangeBlockingReasonPacket} from "../../../../Lib/src/packets/utils/ChangeBlockingReasonPacket";

/**
 * Functions to call when you want to manage the blocking of a player
 */
export class BlockingUtils {
	private static spamDelay = 1000;

	private static blockedPlayers: Map<number, { reason: BlockingReason, limitTimestamp: number }[]> = new Map();

	private static spamPlayers: Map<number, number> = new Map();

	/**
	 * Block a player with a given reason and time
	 * @param playerId
	 * @param reason
	 * @param maxTime
	 */
	static blockPlayer(playerId: number, reason: BlockingReason, maxTime = 0): void {
		if (!BlockingUtils.blockedPlayers.get(playerId)) {
			BlockingUtils.blockedPlayers.set(playerId, []);
		}
		BlockingUtils.blockedPlayers.get(playerId).push({
			reason,
			limitTimestamp: maxTime !== 0 ? Date.now() + maxTime : 0
		});
	}

	/**
	 * Block a player with a given reason and at an end time
	 * @param playerId
	 * @param reason
	 * @param endTimestamp
	 */
	static blockPlayerUntil(playerId: number, reason: BlockingReason, endTimestamp: number): void {
		if (!BlockingUtils.blockedPlayers.get(playerId)) {
			BlockingUtils.blockedPlayers.set(playerId, []);
		}
		BlockingUtils.blockedPlayers.get(playerId).push({
			reason,
			limitTimestamp: endTimestamp
		});
	}

	/**
	 * Unblock a player for a given reason
	 * @param playerId
	 * @param reason
	 */
	static unblockPlayer(playerId: number, reason: BlockingReason): void {
		const blockedPlayer = BlockingUtils.blockedPlayers.get(playerId);
		if (blockedPlayer) {
			BlockingUtils.blockedPlayers.set(playerId, blockedPlayer.filter(v => v.reason !== reason));
			if (BlockingUtils.blockedPlayers.get(playerId).length === 0) {
				BlockingUtils.blockedPlayers.delete(playerId);
			}
		}
	}

	/**
	 * Gets why this player is blocked (empty list means it isn't blocked)
	 * @param playerId
	 */
	static getPlayerBlockingReason(playerId: number): BlockingReason[] {
		const blockedPlayer = BlockingUtils.blockedPlayers.get(playerId);
		const response: BlockingReason[] = [];
		if (blockedPlayer) {
			for (const block of blockedPlayer) {
				if (block.limitTimestamp !== 0 && block.limitTimestamp < Date.now()) {
					BlockingUtils.unblockPlayer(playerId, block.reason);
				}
				else {
					response.push(block.reason);
				}
			}
		}
		return response;
	}

	/**
	 * Block a player for spamming
	 * @param playerId
	 */
	static spamBlockPlayer(playerId: number): void {
		BlockingUtils.spamPlayers.set(playerId, Date.now() + BlockingUtils.spamDelay);
	}

	/**
	 * Checks if a player is spamming
	 * @param playerId
	 */
	static isPlayerSpamming(playerId: number): boolean {
		const spamPlayerLimitTimestamp = this.spamPlayers.get(playerId);
		let response = false;
		if (spamPlayerLimitTimestamp) {
			if (spamPlayerLimitTimestamp < Date.now()) {
				this.spamPlayers.delete(playerId);
			}
			else {
				response = true;
			}
		}
		return response;
	}

	/**
	 * Append BlockedPackets if the player is blocked, and return true
	 * @param player
	 * @param packets
	 */
	// TODO optimize: use only the keycloak ID so we don't have to fetch the player from the database
	static appendBlockedPacket(player: Player, packets: DraftBotPacket[]): boolean {
		const blockingReason = BlockingUtils.getPlayerBlockingReason(player.id);
		if (blockingReason.length !== 0) {
			packets.push(makePacket(BlockedPacket, {keycloakId: player.keycloakId, reasons: blockingReason}));
			return true;
		}

		return false;
	}

	static async changeBlockingReason(context: PacketContext, packet: ChangeBlockingReasonPacket): Promise<void> {
		const player = await Players.getByKeycloakId(context.keycloakId);
		if (this.getPlayerBlockingReason(player.id).includes(packet.oldReason)) {
			if (packet.newReason !== BlockingConstants.REASONS.NONE) {
				this.blockPlayer(player.id, packet.newReason);
			}
			this.unblockPlayer(player.id, packet.oldReason);
		}
	}

	static isPlayerBlockedWithReason(playerId: number, reason: BlockingReason): boolean {
		return BlockingUtils.getPlayerBlockingReason(playerId).includes(reason);
	}
}