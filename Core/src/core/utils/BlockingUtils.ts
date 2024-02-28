import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {BlockedPacket} from "../../../../Lib/src/packets/commands/BlockedPacket";
import Player from "../database/game/models/Player";

/**
 * Functions to call when you want to manage the blocking of a player
 */
export class BlockingUtils {
	private static spamDelay = 1000;

	private static blockedPlayers: Map<number, { reason: string, limitTimestamp: number }[]> = new Map();

	private static spamPlayers: Map<number, number> = new Map();

	/**
	 * Block a player with a given reason and time
	 * @param playerId
	 * @param reason
	 * @param maxTime
	 */
	static blockPlayer(playerId: number, reason: string, maxTime = 0): void {
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
	static blockPlayerUntil(playerId: number, reason: string, endTimestamp: number): void {
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
	static unblockPlayer(playerId: number, reason: string): void {
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
	static getPlayerBlockingReason(playerId: number): string[] {
		const blockedPlayer = BlockingUtils.blockedPlayers.get(playerId);
		const response = [];
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
	static appendBlockedPacket(player: Player, packets: DraftBotPacket[]): boolean {
		const blockingReason = BlockingUtils.getPlayerBlockingReason(player.id);
		if (blockingReason.length !== 0) {
			packets.push(makePacket(BlockedPacket, { keycloakId: player.keycloakId, reasons: blockingReason }));
			return true;
		}

		return false;
	}
}