import {SlashCommandBuilder} from "@discordjs/builders";
import {ApplicationCommandPermissions} from "discord.js";
import {KeycloakUser} from "../../../Lib/src/keycloak/KeycloakUser";
import {DraftBotPacket} from "../../../Lib/src/packets/DraftBotPacket";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";
import {Effect} from "../../../Lib/src/enums/Effect";

/**
 * The interface a classical command MUST take to be able to be executed
 */
export interface ICommand {
	slashCommandBuilder: SlashCommandBuilder,

	getPacket: (interaction: DraftbotInteraction, user: KeycloakUser) => DraftBotPacket | Promise<DraftBotPacket> | Promise<null> | null;

	requirements: {
		requiredLevel?: number,
		disallowEffects?: Effect[],
		allowEffects?: string[],
		userPermission?: string,
		guildRequired?: boolean,
		guildPermissions?: number
	},

	mainGuildCommand: boolean,
	slashCommandPermissions?: ApplicationCommandPermissions[]
}