import { SlashCommandBuilder } from "@discordjs/builders";
import {ApplicationCommandPermissionData, CommandInteraction} from "discord.js";
import Entity from "../core/models/Entity";

export interface ICommand {
	slashCommandBuilder: SlashCommandBuilder,

	executeCommand: (interaction: CommandInteraction, language: string, entity: Entity) => Promise<void>;

	requirements: {
		requiredLevel: number | null,
		disallowEffects: string[] | null,
		allowEffects: string[] | null,
		userPermission: string | null,
		guildRequired: boolean | null,
		guildPermissions: number | null
	},

	mainGuildCommand: boolean,
	slashCommandPermissions: ApplicationCommandPermissionData[] | null
}