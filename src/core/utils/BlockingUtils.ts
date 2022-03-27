import {CommandInteraction, ReactionCollector, TextBasedChannel, User} from "discord.js";
import {IPCClient} from "../bot/ipc/IPCClient";
import {Translations} from "../Translations";
import {sendErrorMessage} from "./ErrorUtils";

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

/**
 * Send an error if the user is blocked by a command
 * @param {User} user
 * @param {TextBasedChannel} channel
 * @param {"fr"|"en"} language
 * @param interaction - optional interaction to reply to
 * @returns {boolean}
 */
export async function sendBlockedError(user: User, channel: TextBasedChannel, language: string, interaction: CommandInteraction = null ) {
	const blockingReason = await BlockingUtils.getPlayerBlockingReason(user.id);
	if (blockingReason !== null) {
		await sendErrorMessage(user, channel, language, Translations.getModule("error", language).format("playerBlocked", {
			context: Translations.getModule("error", language).get("blockedContext." + blockingReason)
		}),false, interaction);
		return true;
	}
	return false;
}