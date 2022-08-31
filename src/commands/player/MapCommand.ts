import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entity} from "../../core/database/game/models/Entity";
import {ICommand} from "../ICommand";
import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Translations} from "../../core/Translations";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {BotConstants} from "../../core/constants/BotConstants";
import {format} from "../../core/utils/StringFormatter";

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

	const inReport = await entity.isInEvent();
	const destMap = await entity.Player.getDestination();
	const strMapLink = await getStrMapWithCursor(entity, inReport);
	mapEmbed.setImage(
		format(BotConstants.MAP_URL_WITH_CURSOR, {mapLink: strMapLink})
	);
	mapEmbed.setDescription(mapModule.format(
		inReport ? "descTextReached" : "descText", {
			direction: destMap.getDisplayName(language),
			dirDesc: destMap.getDescription(language),
			particle: destMap.getParticleName(language)
		}));
	await interaction.reply({embeds: [mapEmbed]});
}

/**
 * Get the map image link with the cursor on the player position
 * @param entity Entity
 * @param inReport
 */
async function getStrMapWithCursor(entity: Entity, inReport: boolean): Promise<string> {
	const destMap = await entity.Player.getDestination();
	const depMap = await entity.Player.getPreviousMap();
	if (inReport) {
		return `${destMap.id}_`;
	}
	if (destMap.id < depMap.id) {
		return `${destMap.id}_${depMap.id}_`;
	}
	return `${depMap.id}_${destMap.id}_`;

}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("map")
		.setDescription("Displays the map and the position of the player."),
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};