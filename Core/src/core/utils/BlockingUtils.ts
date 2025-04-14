import {
	DraftBotPacket, makePacket
} from "../../../../Lib/src/packets/DraftBotPacket";
import { BlockedPacket } from "../../../../Lib/src/packets/commands/BlockedPacket";
import {
	BlockingConstants, BlockingReason
} from "../../../../Lib/src/constants/BlockingConstants";
import { ChangeBlockingReasonPacket } from "../../../../Lib/src/packets/utils/ChangeBlockingReasonPacket";

/**
 * Functions to call when you want to manage the blocking of a player
 */
export class BlockingUtils {
	private static blockedPlayers: Map<string, {
		reason: BlockingReason; limitTimestamp: number;
	}[]> = new Map();

	/**
	 * Block a player with a given reason and time
	 * @param keycloakId
	 * @param reason
	 * @param maxTime
	 */
	static blockPlayer(keycloakId: string, reason: BlockingReason, maxTime = 0): void {
		if (!BlockingUtils.blockedPlayers.get(keycloakId)) {
			BlockingUtils.blockedPlayers.set(keycloakId, []);
		}
		BlockingUtils.blockedPlayers.get(keycloakId).push({
			reason,
			limitTimestamp: maxTime !== 0 ? Date.now() + maxTime : 0
		});
	}

	/**
	 * Block a player with a given reason and at an end time
	 * @param keycloakId
	 * @param reason
	 * @param endTimestamp
	 */
	static blockPlayerUntil(keycloakId: string, reason: BlockingReason, endTimestamp: number): void {
		if (!BlockingUtils.blockedPlayers.get(keycloakId)) {
			BlockingUtils.blockedPlayers.set(keycloakId, []);
		}
		BlockingUtils.blockedPlayers.get(keycloakId).push({
			reason,
			limitTimestamp: endTimestamp
		});
	}

	/**
	 * Unblock a player for a given reason
	 * @param keycloakId
	 * @param reason
	 */
	static unblockPlayer(keycloakId: string, reason: BlockingReason): void {
		const blockedPlayer = BlockingUtils.blockedPlayers.get(keycloakId);
		if (blockedPlayer) {
			BlockingUtils.blockedPlayers.set(keycloakId, blockedPlayer.filter(v => v.reason !== reason));
			if (BlockingUtils.blockedPlayers.get(keycloakId).length === 0) {
				BlockingUtils.blockedPlayers.delete(keycloakId);
			}
		}
	}

	/**
	 * Gets why this player is blocked (empty list means it isn't blocked)
	 * @param keycloakId
	 */
	static getPlayerBlockingReason(keycloakId: string): BlockingReason[] {
		const blockedPlayer = BlockingUtils.blockedPlayers.get(keycloakId);
		const response: BlockingReason[] = [];
		if (blockedPlayer) {
			for (const block of blockedPlayer) {
				if (block.limitTimestamp !== 0 && block.limitTimestamp < Date.now()) {
					BlockingUtils.unblockPlayer(keycloakId, block.reason);
				}
				else {
					response.push(block.reason);
				}
			}
		}
		return response;
	}

	/**
	 * Append BlockedPackets if the player is blocked, and return true
	 * @param keycloakId
	 * @param packets
	 */
	static appendBlockedPacket(keycloakId: string, packets: DraftBotPacket[]): boolean {
		const blockingReason = BlockingUtils.getPlayerBlockingReason(keycloakId);
		if (blockingReason.length !== 0) {
			packets.push(makePacket(BlockedPacket, {
				keycloakId, reasons: blockingReason
			}));
			return true;
		}

		return false;
	}

	static changeBlockingReason(keycloakId: string, packet: ChangeBlockingReasonPacket): void {
		if (this.getPlayerBlockingReason(keycloakId).includes(packet.oldReason)) {
			if (packet.newReason !== BlockingConstants.REASONS.NONE) {
				this.blockPlayer(keycloakId, packet.newReason);
			}
			this.unblockPlayer(keycloakId, packet.oldReason);
		}
	}

	static isPlayerBlockedWithReason(keycloakId: string, reason: BlockingReason): boolean {
		return BlockingUtils.getPlayerBlockingReason(keycloakId).includes(reason);
	}

	static isPlayerBlocked(keycloakId: string): boolean {
		return BlockingUtils.getPlayerBlockingReason(keycloakId).length !== 0;
	}

	static getBlockedPlayersCount(): number {
		let count = 0;
		for (const blockedPlayer of BlockingUtils.blockedPlayers.values()) {
			for (const block of blockedPlayer) {
				if (block.limitTimestamp === 0 || block.limitTimestamp > Date.now()) {
					count++;
				}
			}
		}
		return count;
	}
}
