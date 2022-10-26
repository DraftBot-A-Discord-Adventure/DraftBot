import {CommandInteraction, ReactionCollector, User} from "discord.js";
import {IPCClient} from "../bot/ipc/IPCClient";
import {Translations} from "../Translations";
import {replyErrorMessage} from "./ErrorUtils";
import {escapeUsername} from "./StringUtils";
import {format} from "./StringFormatter";

/**
 * Functions to call when you want to manage the blocking of a player
 */
export class BlockingUtils {
	/**
	 * Block a player with a given reason and time
	 * @param discordId
	 * @param reason
	 * @param maxTime
	 */
	static blockPlayer(discordId: string, reason: string, maxTime = 0): void {
		IPCClient.ipcBlockPlayer(discordId, reason, maxTime);
	}

	/**
	 * Block a player with a given discord collector
	 * @param discordId
	 * @param reason
	 * @param collector
	 */
	static blockPlayerWithCollector(discordId: string, reason: string, collector: ReactionCollector): void {
		BlockingUtils.blockPlayer(discordId, reason, collector.options.time);
	}

	/**
	 * Unblock a player for a given reason
	 * @param discordId
	 * @param reason
	 */
	static unblockPlayer(discordId: string, reason: string): void {
		IPCClient.ipcUnblockPlayer(discordId, reason);
	}

	/**
	 * Gets why this player is blocked (empty list means it isn't blocked)
	 * @param discordId
	 */
	static async getPlayerBlockingReason(discordId: string): Promise<string[]> {
		return await IPCClient.ipcGetBlockedPlayerReason(discordId);
	}

	/**
	 * Block a player for spamming
	 * @param discordId
	 */
	static spamBlockPlayer(discordId: string): void {
		IPCClient.ipcSpamBlockPlayer(discordId);
	}

	/**
	 * Checks if a player is spamming
	 * @param discordId
	 */
	static async isPlayerSpamming(discordId: string): Promise<boolean> {
		return await IPCClient.ipcIsPlayerSpamming(discordId);
	}
}

/**
 * Get all printable blocking reasons from the given blocking reason list
 * @param blockingReason
 * @param language
 */
export function getErrorReasons(blockingReason: string[], language: string): string {
	let errorReasons = "";
	blockingReason.forEach(reason => {
		errorReasons = errorReasons.concat(`${Translations.getModule("error", language).get(`blockedContext.${reason}`)}, `);
	});
	return errorReasons.slice(0, -2);
}

/**
 * Send an error if the user is blocked by a command
 * @param {User} user
 * @param {"fr"|"en"} language
 * @param interaction - optional interaction to reply to
 * @returns {boolean}
 */
export async function sendBlockedError(interaction: CommandInteraction, language: string, user: User = interaction.user): Promise<boolean> {
	const blockingReason = await BlockingUtils.getPlayerBlockingReason(user.id);
	if (blockingReason.length !== 0) {
		await replyErrorMessage(
			interaction,
			language,
			Translations.getModule("error", language).format(
				user === interaction.user ? "playerBlocked" : "anotherPlayerBlocked", {
					context: format(getErrorReasons(blockingReason, language), {}),
					username: escapeUsername(user.username)
				}
			)
		);
		return true;
	}
	return false;
}