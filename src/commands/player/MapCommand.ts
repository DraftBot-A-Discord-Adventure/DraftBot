import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {BotConstants} from "../../core/constants/BotConstants";
import {format} from "../../core/utils/StringFormatter";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player from "../../core/database/game/models/Player";

/**
 * Get the map image link with the cursor on the player position
 * @param player Entity
 * @param inReport
 */
async function getStrMapWithCursor(player: Player, inReport: boolean): Promise<string> {
	const destMap = await player.getDestination();
	const depMap = await player.getPreviousMap();
	if (inReport) {
		return `${destMap.id}_`;
	}
	if (destMap.id < depMap.id) {
		return `${destMap.id}_${depMap.id}_`;
	}
	return `${depMap.id}_${destMap.id}_`;

}

/**
 * Show the map of DraftBot world
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	const mapModule = Translations.getModule("commands.map", language);
	const mapEmbed = new DraftBotEmbed()
		.formatAuthor(mapModule.get("text"), interaction.user);

	const inReport = await player.isInEvent();
	const destMap = await player.getDestination();
	const strMapLink = await getStrMapWithCursor(player, inReport);
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

const currentCommandFrenchTranslations = Translations.getModule("commands.map", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.map", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};