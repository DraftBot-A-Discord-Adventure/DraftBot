import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {getNextSaturdayMidnight, printTimeBeforeDate, todayIsSunday} from "../../core/utils/TimeUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {NumberChangeReason} from "../../core/constants/LogsConstants";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {draftBotInstance} from "../../core/bot";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player, {Players} from "../../core/database/game/models/Player";
import {InventorySlots} from "../../core/database/game/models/InventorySlot";
import {giveItemToPlayer} from "../../core/utils/ItemUtils";
import League from "../../core/database/game/models/League";


/**
 * Load the description of the ligueReward command embed
 * @param embed
 * @param leagueRewardModule
 * @param player
 * @param leagueLastSeason
 * @param language
 * @param scoreToAward
 */
async function generateDescription(embed: DraftBotEmbed, leagueRewardModule: TranslationModule, player: Player, leagueLastSeason: League, language: string, scoreToAward: number): Promise<void> {
	const rank = await Players.getLastSeasonGloryRankById(player.id);
	embed.setDescription(
		leagueRewardModule.format(rank === 1 ? "ligueRewardSuccessDescriptionFirstPosition" : "ligueRewardSuccessDescription", {
			glory: player.gloryPointsLastSeason,
			rank,
			league: leagueLastSeason.toString(language),
			money: leagueLastSeason.getMoneyToAward(),
			scoreToAward,
			xp: leagueLastSeason.getXPToAward(),
			compressionImpact: player.getCompressionImpact()
		})
	);
}

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
			time: printTimeBeforeDate(getNextSaturdayMidnight())
		}));
		return;
	}

	if (player.gloryPointsLastSeason === 0) {
		await replyErrorMessage(interaction, language, leagueRewardModule.get("noRewardError"));
		return;
	}

	if (await player.hasClaimedLeagueReward()) {
		await replyErrorMessage(interaction, language, leagueRewardModule.get("alreadyReceivedError"));
		return;
	}
	await interaction.deferReply();
	const leagueLastSeason = await player.getLeagueLastSeason();

	// Give the reward to the player : money, xp and an item
	await player.addMoney({
		amount: leagueLastSeason.getMoneyToAward(),
		channel: interaction.channel,
		language,
		reason: NumberChangeReason.LEAGUE_REWARD
	});

	await player.addExperience({
		amount: leagueLastSeason.getXPToAward(),
		channel: interaction.channel,
		language,
		reason: NumberChangeReason.LEAGUE_REWARD
	});

	const scoreToAward = await player.getLastSeasonScoreToAward();
	await player.addScore({
		amount: scoreToAward,
		channel: interaction.channel,
		language,
		reason: NumberChangeReason.LEAGUE_REWARD
	});

	const embed = new DraftBotEmbed().formatAuthor(leagueRewardModule.get("ligueRewardSuccessTitle"), interaction.user);
	await generateDescription(embed, leagueRewardModule, player, leagueLastSeason, language, scoreToAward);
	await player.save();
	await interaction.followUp({embeds: [embed]});

	const item = await leagueLastSeason.generateRewardItem();
	await giveItemToPlayer(player, item, language, interaction.user, interaction.channel, await InventorySlots.getOfPlayer(player.id));


	await draftBotInstance.logsDatabase.logPlayerLeagueReward(player.discordUserId, leagueLastSeason.id);
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
