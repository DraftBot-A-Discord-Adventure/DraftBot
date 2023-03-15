import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {getNextSaturdayMidnight, parseTimeDifference, todayIsSunday} from "../../core/utils/TimeUtils";
import {Translations} from "../../core/Translations";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {NumberChangeReason} from "../../core/constants/LogsConstants";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {draftBotInstance} from "../../core/bot";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player from "../../core/database/game/models/Player";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {giveItemToPlayer} from "../../core/utils/ItemUtils";


/**
 * Activate your daily item effect
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const leagueRewardModule = Translations.getModule("commands.leagueReward", language);

	if (!todayIsSunday()) {
		await replyErrorMessage(interaction, language, leagueRewardModule.format("notSundayError", {
			time: parseTimeDifference(Date.now(), getNextSaturdayMidnight(), language)
		}));
		return;
	}

	if (player.gloryPointsLastSeason === 0) {
		await replyErrorMessage(interaction, language, leagueRewardModule.get("noRewardError"));
		return;
	}

	if (player.gloryPointsLastSeason === -1) {
		await replyErrorMessage(interaction, language, leagueRewardModule.get("alreadyReceivedError"));
		return;
	}

	const leagueLastSeason = await player.getLeagueLastSeason();

	// Give the reward to the player : money, xp and an item
	await player.addMoney({
		amount: leagueLastSeason.getMoneyToAward(),
		channel: interaction.channel,
		language: language,
		reason: NumberChangeReason.LIGUE_REWARD
	});

	// Give the reward to the player : money, xp and an item
	await player.addExperience({
		amount: leagueLastSeason.getXPToAward(),
		channel: interaction.channel,
		language: language,
		reason: NumberChangeReason.LIGUE_REWARD
	});

	const embed = new DraftBotEmbed().formatAuthor(leagueRewardModule.get("ligueRewardSuccessTitle"), interaction.user);
	embed.setDescription(
		leagueRewardModule.format("ligueRewardSuccessDescription", {
			glory: player.gloryPointsLastSeason,
			league: leagueLastSeason.toString(language),
			money: leagueLastSeason.getMoneyToAward(),
			xp: leagueLastSeason.getXPToAward()
		})
	);
	player.gloryPointsLastSeason = -1;
	await player.save();
	await interaction.reply({embeds: [embed]});

	const item = await leagueLastSeason.generateRewardItem();
	await giveItemToPlayer(player, item, language, interaction.user, interaction.channel, await InventorySlots.getOfPlayer(player.id));


	draftBotInstance.logsDatabase.logPlayerLeagueReward(player.discordUserId, leagueLastSeason.id).then();
}

const currentCommandFrenchTranslations = Translations.getModule("commands.leagueReward", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.leagueReward", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		allowEffects: [EffectsConstants.EMOJI_TEXT.SMILEY]
	},
	mainGuildCommand: false
};
