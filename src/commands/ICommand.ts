import {SlashCommandBuilder} from "@discordjs/builders";
import {ApplicationCommandPermissions, CommandInteraction} from "discord.js";
import Player from "../core/database/game/models/Player";
import {Effect, Language} from "../core/constants/TypeConstants";

/**
 * The interface a classical command MUST take to be able to be executed
 */
export interface ICommand {
	slashCommandBuilder: SlashCommandBuilder,

	executeCommand: (interaction: CommandInteraction, language: Language, player: Player, ...addedArgs: unknown[]) => Promise<void>;

	requirements: {
		requiredLevel?: number,
		disallowEffects?: Effect[],
		allowEffects?: Effect[],
		userPermission?: string,
		guildRequired?: boolean,
		guildPermissions?: number
	},

	mainGuildCommand: boolean,
	slashCommandPermissions?: ApplicationCommandPermissions[]
}