import {SlashCommandBuilder} from "@discordjs/builders";
import {ApplicationCommandPermissions, CommandInteraction} from "discord.js";
import Player from "../core/database/game/models/Player";

/**
 * The interface a classical command MUST take to be able to be executed
 */
export interface ICommand {
	slashCommandBuilder: SlashCommandBuilder,

	executeCommand: (interaction: CommandInteraction, language: string, player: Player, ...addedArgs: unknown[]) => Promise<void>;

	requirements: {
		requiredLevel?: number,
		disallowEffects?: string[],
		allowEffects?: string[],
		userPermission?: string,
		guildRequired?: boolean,
		guildPermissions?: number
	},

	mainGuildCommand: boolean,
	slashCommandPermissions?: ApplicationCommandPermissions[]
}