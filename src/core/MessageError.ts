import {DraftBotEmbed} from "./messages/DraftBotEmbed";
import {CommandInteraction, GuildMember, Permissions} from "discord.js";
import {Constants} from "./Constants";
import {Translations} from "./Translations";
import {botConfig} from "./bot";

export class MessageError {
	/**
	 *
	 * @param member
	 * @param interaction
	 * @param language
	 * @param permission
	 * @returns {Promise<boolean|*>}
	 */
	static async canPerformCommand(member: GuildMember, interaction: CommandInteraction, language: string, permission: string): Promise<boolean> {
		if (this.hasNotPermission(permission, member)) {
			await MessageError.permissionErrorMe(member, interaction, language, permission);
			return false;
		}
		return true;
	}

	/**
	 * @param {string} id
	 * @return {boolean}
	 */
	static isBotOwner(id: string): boolean {
		return id === botConfig.BOT_OWNER_ID;
	}

	/**
	 * Reply with an error "missing permissions"
	 * @param member
	 * @param interaction
	 * @param language
	 * @param permission
	 * @returns {Promise<*>}
	 */
	static async permissionErrorMe(member: GuildMember, interaction: CommandInteraction, language: string, permission: string): Promise<void> {
		const tr = Translations.getModule("error", language);
		const embed = new DraftBotEmbed()
			.setErrorColor()
			.formatAuthor(tr.get("titlePermissionError"), member.user);

		if (permission === Constants.PERMISSION.ROLE.ADMINISTRATOR) {
			embed.setDescription(tr.get("administratorPermissionMissing"));
		}
		return await interaction.reply({embeds: [embed]});
	}

	/**
	 * check if the user has the permission to use the command
	 * @param {string} permission
	 * @param {boolean} member
	 * @private
	 */
	private static hasNotPermission(permission: string, member: GuildMember): boolean {
		return (permission === Constants.PERMISSION.ROLE.BADGE_MANAGER
				&& !member.roles.cache.has(botConfig.BADGE_MANAGER_ROLE)
				|| permission === Constants.PERMISSION.ROLE.ADMINISTRATOR
				&& !member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
				|| permission === Constants.PERMISSION.ROLE.CONTRIBUTORS
				&& !member.roles.cache.has(botConfig.CONTRIBUTOR_ROLE)
				|| permission === Constants.PERMISSION.ROLE.BOT_OWNER)
			&& !MessageError.isBotOwner(member.id);
	}
}
