import {DraftBotEmbed} from "./messages/DraftBotEmbed";
import {CommandInteraction, GuildMember, Permissions} from "discord.js";
import {Constants} from "./Constants";
import { Translations } from "./Translations";

declare const JsonReader: any;

export class MessageError {
	/**
	 *
	 * @param member
	 * @param interaction
	 * @param language
	 * @param permission
	 * @returns {Promise<boolean|*>}
	 */
	static async canPerformCommand(member: GuildMember, interaction: CommandInteraction, language: string, permission: string) {
		if (permission === Constants.PERMISSION.ROLE.BADGE_MANAGER) {
			if (!member.roles.cache.has(JsonReader.app.BADGE_MANAGER_ROLE) && !MessageError.isBotOwner(member.id)) {
				return await MessageError.permissionErrorMe(member, interaction, language, permission);
			}
		}

		if (permission === Constants.PERMISSION.ROLE.CONTRIBUTORS) {
			if (!member.roles.cache.has(JsonReader.app.CONTRIBUTOR_ROLE) && !MessageError.isBotOwner(member.id)) {
				return await MessageError.permissionErrorMe(member, interaction, language, permission);
			}
		}

		if (permission === Constants.PERMISSION.ROLE.SUPPORT) {
			if (!member.roles.cache.has(JsonReader.app.SUPPORT_ROLE) && !MessageError.isBotOwner(member.id)) {
				return await MessageError.permissionErrorMe(member, interaction, language, permission);
			}
		}

		if (permission === Constants.PERMISSION.ROLE.ADMINISTRATOR) {
			if (!member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) && !MessageError.isBotOwner(member.id)) {
				return await MessageError.permissionErrorMe(member, interaction, language, permission);
			}
		}

		if (permission === Constants.PERMISSION.ROLE.BOT_OWNER) {
			if (!MessageError.isBotOwner(member.id)) {
				return await MessageError.permissionErrorMe(member, interaction, language, permission);
			}
		}

		return true;
	}

	/**
	 * @param {string} id
	 * @return {boolean}
	 */
	static isBotOwner(id: string) {
		return id === JsonReader.app.BOT_OWNER_ID;
	}

	/**
	 * Reply with an error "missing permissions"
	 * @param user
	 * @param interaction
	 * @param language
	 * @param permission
	 * @returns {Promise<*>}
	 */
	static async permissionErrorMe(member: GuildMember, interaction: CommandInteraction, language: string, permission: string) {
		const tr = Translations.getModule("error", language);
		const embed = new DraftBotEmbed()
			.setErrorColor()
			.formatAuthor(tr.get("titlePermissionError"), member.user);

		if (permission === Constants.PERMISSION.ROLE.ADMINISTRATOR) {
			embed.setDescription(tr.get("administratorPermissionMissing"));
		}
		return await interaction.reply({embeds: [embed]});
	}
}
