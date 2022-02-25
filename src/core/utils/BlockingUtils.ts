import {ReactionCollector} from "discord.js";
import {IPCClient} from "../bot/ipc/IPCClient";

export class BlockingUtils {
	static blockPlayer(discordId: string, reason: string, maxTime = 0): void {
		IPCClient.ipcBlockPlayer(discordId, reason, maxTime);
	}

	static blockPlayerWithCollector(discordId: string, reason: string, collector: ReactionCollector): void {
		BlockingUtils.blockPlayer(discordId, reason, collector.options.time);
	}

	static unblockPlayer(discordId: string): void {
		IPCClient.ipcUnblockPlayer(discordId);
	}

	static async getPlayerBlockingReason(discordId: string): Promise<string | null> {
		return await IPCClient.ipcGetBlockedPlayerReason(discordId);
	}

	static spamBlockPlayer(discordId: string): void {
		IPCClient.ipcSpamBlockPlayer(discordId);
	}

	static async isPlayerSpamming(discordId: string): Promise<boolean> {
		return await IPCClient.ipcIsPlayerSpamming(discordId);
	}
}