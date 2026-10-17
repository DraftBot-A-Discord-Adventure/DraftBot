import { SlashCommandBuilder } from "@discordjs/builders";
import {
	ApplicationCommandPermissions, AutocompleteInteraction
} from "discord.js";
import { KeycloakUser } from "../../../Lib/src/keycloak/KeycloakUser";
import { CrowniclesPacket } from "../../../Lib/src/packets/CrowniclesPacket";
import { CrowniclesInteraction } from "../messages/CrowniclesInteraction";

/**
 * The interface a classical command MUST take to be able to be executed
 */
export interface ICommand {
	slashCommandBuilder: SlashCommandBuilder;

	getPacket: (interaction: CrowniclesInteraction, user: KeycloakUser) => CrowniclesPacket | Promise<CrowniclesPacket> | Promise<null> | null;

	mainGuildCommand: boolean;
	slashCommandPermissions?: ApplicationCommandPermissions[];

	/**
	 * Whether the command can be used in a tournament channel. Participant checks are enforced by the Core:
	 * the front only filters the commands that make sense in a tournament channel
	 */
	allowedInTournament?: boolean;

	/**
	 * Optional handler for autocomplete interactions
	 */
	handleAutocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}
