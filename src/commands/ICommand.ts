import {SlashCommandBuilder} from "@discordjs/builders";
import {ApplicationCommandPermissionData, CommandInteraction} from "discord.js";
import Entity from "../core/database/game/models/Entity";

export interface ICommand {
	slashCommandBuilder: SlashCommandBuilder,

	executeCommand: (interaction: CommandInteraction, language: string, entity: Entity, ...addedArgs: unknown[]) => Promise<void>;

	requirements: {
		requiredLevel?: number,
		disallowEffects?: string[],
		allowEffects?: string[],
		userPermission?: string,
		guildRequired?: boolean,
		guildPermissions?: number
	},

	mainGuildCommand: boolean,
	slashCommandPermissions?: ApplicationCommandPermissionData[]
}