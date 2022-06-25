import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entity} from "../../core/models/Entity";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Translations} from "../../core/Translations";
import Player from "../../core/models/Player";

/**
 * Show the map of DraftBot world
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	const mapModule = Translations.getModule("commands.map", language);
	const mapEmbed = new DraftBotEmbed()
		.formatAuthor(mapModule.get("text"), interaction.user);

	const destMap = await entity.Player.getDestination();
	const strMapLink = await getStrMapWithCursor(entity.Player);
	mapEmbed.setImage(
		mapModule.format("URL_WITH_CURSOR", {mapLink: strMapLink})
	);
	mapEmbed.setDescription(mapModule.format(
		"descText", {
			direction: destMap.getDisplayName(language),
			dirDesc: destMap.getDescription(language),
			particle: destMap.getParticleName(language)
		}));
	await interaction.reply({embeds: [mapEmbed]});

	// TODO REFACTOR LES LOGS
	// log("Player " + interaction.user + " asked the map");
}

/**
 * Get the map image link with the cursor on the player position
 * @param player Player
 */
async function getStrMapWithCursor(player: Player) {
	const destMap = await player.getDestination();
	const depMap = await player.getPreviousMap();
	let strMapLink;
	if (destMap.id < depMap.id) {
		strMapLink = "" + destMap.id + "_" + depMap.id + "_";
	}
	else {
		strMapLink = "" + depMap.id + "_" + destMap.id + "_";
	}
	return strMapLink;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("map")
		.setDescription("Displays the map and the position of the player."),
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD]
	},
	mainGuildCommand: false
};