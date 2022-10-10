import {MapLinks} from "../../core/database/game/models/MapLink";
import {Maps} from "../../core/maps/Maps";
import {PlayerSmallEvents} from "../../core/database/game/models/PlayerSmallEvent";
import {escapeUsername} from "../../core/utils/StringUtils";
import {ICommand} from "../ICommand";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {NumberChangeReason} from "../../core/database/logs/LogsDatabase";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {RespawnConstants} from "../../core/constants/RespawnConstants";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {TravelTime} from "../../core/maps/TravelTime";
import Player from "../../core/database/game/models/Player";

/**
 * Allow a player who is dead to respawn
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const respawnModule = Translations.getModule("commands.respawn", language);
	if (player.effect !== EffectsConstants.EMOJI_TEXT.DEAD) {
		await replyErrorMessage(interaction, language, respawnModule.format("alive", {pseudo: player.getPseudo(language)}));
		return;
	}
	const lostScore = Math.round(player.score * RespawnConstants.SCORE_REMOVAL_MULTIPLIER);
	await player.addHealth(await player.getMaxHealth() - player.health, interaction.channel, language, NumberChangeReason.RESPAWN);
	await player.addScore({
		amount: -lostScore,
		channel: interaction.channel,
		language: language,
		reason: NumberChangeReason.RESPAWN
	});

	await player.save();

	await TravelTime.removeEffect(player, NumberChangeReason.RESPAWN);
	await Maps.stopTravel(player);
	const newlink = await MapLinks.getLinkByLocations(
		await player.getPreviousMapId(),
		await player.getDestinationId()
	);
	await Maps.startTravel(player, newlink, interaction.createdAt.valueOf(), NumberChangeReason.RESPAWN);

	await PlayerSmallEvents.removeSmallEventsOfPlayer(player.id);

	await interaction.reply({
		content: respawnModule.format("respawn", {
			pseudo: escapeUsername(interaction.user.username),
			lostScore: lostScore
		})
	});

}

const currentCommandFrenchTranslations = Translations.getModule("commands.respawn", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.respawn", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY]
	},
	mainGuildCommand: false
};
