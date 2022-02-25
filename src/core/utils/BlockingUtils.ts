import {ReactionCollector} from "discord.js";
import {IPCClient} from "../bot/ipc/IPCClient";

export class BlockingUtils {
	static blockPlayer(discordId: string, reason: string, maxTime = 0): void {
		IPCClient.IPCBlockPlayer(discordId, reason, maxTime);
	}

	static blockPlayerWithCollector(discordId: string, reason: string, collector: ReactionCollector): void {
		BlockingUtils.blockPlayer(discordId, reason, collector.options.time);
	}

	static unblockPlayer(discordId: string): void {
		IPCClient.IPCUnblockPlayer(discordId);
	}

	static async getPlayerBlockingReason(discordId: string): Promise<string | null> {
		return await IPCClient.IPCGetBlockedPlayerReason(discordId);
	}

	static spamBlockPlayer(discordId: string): void {
		IPCClient.IPCSpamBlockPlayer(discordId);
	}

	static async isPlayerSpamming(discordId: string): Promise<boolean> {
		return await IPCClient.IPCIsPlayerSpamming(discordId);
	}
}