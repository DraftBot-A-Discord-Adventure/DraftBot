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
import {MapLinks} from "../../core/database/game/models/MapLink";
import MapLocation from "../../core/database/game/models/MapLocation";

/**
 * Get the map image link with the cursor on the player position
 * @param player player
 * @param destMap
 * @param inReport
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function getMapToShowInfo(player: Player, destMap: MapLocation, inReport: boolean, language: string): Promise<{
	name: string,
	forced: boolean
}> {
	const mapLink = await MapLinks.getById(player.mapLinkId);

	if (!inReport && mapLink.forcedImage) {
		return {
			name: mapLink.forcedImage,
			forced: true
		};
	}
	const depMap = await player.getPreviousMap();

	if (inReport) {
		return {
			name: destMap.forcedImage ?? `${language}_${destMap.id}_`,
			forced: Boolean(destMap.forcedImage)
		};
	}

	if (destMap.id < depMap.id) {
		return {
			name: `${language}_${destMap.id}_${depMap.id}_`,
			forced: false
		};
	}

	return {
		name: `${language}_${depMap.id}_${destMap.id}_`,
		forced: false
	};

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
	const mapToShowInfo = await getMapToShowInfo(player, destMap, inReport, language);
	if (mapToShowInfo.forced) {
		mapEmbed.setImage(
			format(BotConstants.FORCED_MAPS_URL, { name: mapToShowInfo.name })
		);
	}
	else {
		mapEmbed.setImage(
			format(BotConstants.MAP_URL_WITH_CURSOR, { mapLink: mapToShowInfo.name })
		);
	}
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