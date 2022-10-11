import {Maps} from "../../core/maps/Maps";
import {escapeUsername} from "../../core/utils/StringUtils";
import {Constants} from "../../core/Constants";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {TopConstants} from "../../core/constants/TopConstants";
import {Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {getNextSundayMidnight, parseTimeDifference} from "../../core/utils/TimeUtils";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player, {Players} from "../../core/database/game/models/Player";

type TextInformation = { interaction: CommandInteraction, language: string };
type PlayerInformation = { rankCurrentPlayer: number, scoreTooLow: boolean }
type TopInformation = {
	scope: string,
	timing: string,
	page: number,
	numberOfPlayers: number
}

/**
 * Get badge state for a player in the displayed top
 * @param playerToLook
 * @param language
 * @param date
 */
async function getBadgeStateOfPlayer(playerToLook: Player, language: string, date: Date): Promise<string> {
	if (date.valueOf() < playerToLook.effectEndDate.valueOf()) {
		return playerToLook.effect + TopConstants.SEPARATOR;
	}
	// The start travel date is 0 when the event waits for a reaction
	if (playerToLook.isInactive() && playerToLook.startTravelDate.valueOf() !== 0) {
		return TopConstants.INACTIVE_BADGE + TopConstants.SEPARATOR;
	}
	if (await Maps.isArrived(playerToLook, date)) {
		return (await playerToLook.getDestination()).getEmote(language) + TopConstants.SEPARATOR;
	}
	return "";

}

/**
 * Get the badge for a player in the displayed top
 * @param interaction
 * @param playerToLook
 * @param page
 * @param rank
 */
function getBadgeTopPositionOfPlayer(interaction: CommandInteraction, playerToLook: Player, page: number, rank: number): string {
	if (interaction.user.id === playerToLook.discordUserId) {
		return TopConstants.TOP_POSITION_BADGE.WHITE;
	}
	if (page === 1 && rank < 5) {
		return rank === 0
			? TopConstants.TOP_POSITION_BADGE.FIRST
			: rank === 1
				? TopConstants.TOP_POSITION_BADGE.SECOND
				: rank === 2
					? TopConstants.TOP_POSITION_BADGE.THIRD
					: TopConstants.TOP_POSITION_BADGE.MILITARY;
	}
	if (interaction.guild.members.cache.find(user => user.id === playerToLook.discordUserId)) {
		return TopConstants.TOP_POSITION_BADGE.BLUE;
	}
	return TopConstants.TOP_POSITION_BADGE.BLACK;
}

/**
 * Get the badge for the position of the current player
 * @param rankCurrentPlayer
 */
function getBadgePositionOfCurrentPlayer(rankCurrentPlayer: number): string {
	return rankCurrentPlayer === 1
		? TopConstants.TOP_POSITION_BADGE.FIRST
		: rankCurrentPlayer === 2
			? TopConstants.TOP_POSITION_BADGE.SECOND
			: rankCurrentPlayer === 3
				? TopConstants.TOP_POSITION_BADGE.THIRD
				: rankCurrentPlayer < 6
					? TopConstants.TOP_POSITION_BADGE.MILITARY
					: TopConstants.TOP_POSITION_BADGE.BLACK;
}

/**
 * Get the page where the rank will appear
 * @param rank
 */
function getPageOfRank(rank: number): number {
	return Math.ceil(rank / TopConstants.PLAYERS_BY_PAGE);
}

/**
 * Get all the pseudos of a given player list
 * @param playersToShow
 * @param language
 */
function getPseudosOfList(playersToShow: Player[], language: string): Promise<string[]> {
	const pseudos = [];
	for (const entityToShow of playersToShow) {
		pseudos.push(entityToShow.getPseudo(language));
	}
	return Promise.all(pseudos);
}

/**
 * Get all the given players' status
 * @param playersToShow
 * @param language
 * @param date
 */
function getBadgeStatesOfList(playersToShow: Player[], language: string, date: Date): Promise<string[]> {
	const badgeStates = [];
	for (const entityToShow of playersToShow) {
		badgeStates.push(getBadgeStateOfPlayer(entityToShow, language, date));
	}
	return Promise.all(badgeStates);
}

/**
 * Sends a message with the top
 * @param interaction
 * @param language
 * @param scope
 * @param timing
 * @param page
 * @param numberOfPlayers
 * @param rankCurrentPlayer
 * @param scoreTooLow
 * @param playersToShow
 */
async function displayTop(
	{interaction, language}: TextInformation,
	{scope, timing, page, numberOfPlayers}: TopInformation,
	{rankCurrentPlayer, scoreTooLow}: PlayerInformation,
	playersToShow: Player[]): Promise<void> {
	const topModule = Translations.getModule("commands.top", language);
	const actualPlayer = escapeUsername(interaction.user.username);
	const pageMax = numberOfPlayers === 0 ? 1 : getPageOfRank(numberOfPlayers);

	const end = page * TopConstants.PLAYERS_BY_PAGE;
	const start = end - TopConstants.PLAYERS_BY_PAGE + 1;
	const topDisplay: DraftBotEmbed = new DraftBotEmbed()
		.setTitle(topModule.format("topTitle", {
			start,
			end,
			alltime: timing === TopConstants.TIMING_ALLTIME,
			global: scope === TopConstants.GLOBAL_SCOPE
		}));
	let description = [];
	const pseudos = await getPseudosOfList(playersToShow, language);
	const badgeStates = await getBadgeStatesOfList(playersToShow, language, interaction.createdAt);
	for (const playerToShow of playersToShow) {
		const rank = playersToShow.indexOf(playerToShow);
		description.push(topModule.format("playerRankLine", {
			badge: getBadgeTopPositionOfPlayer(interaction, playerToShow, page, rank),
			rank: start + rank,
			pseudo: pseudos[rank],
			badgeState: badgeStates[rank],
			score: timing === TopConstants.TIMING_WEEKLY
				? playerToShow.weeklyScore
				: playerToShow.score,
			level: playerToShow.level
		}));
	}
	if (description.length === 0) {
		description = [topModule.get("nobodyInTop")];
	}
	topDisplay.setDescription(description.join(""))
		.addFields({
			name: topModule.get("yourRanking"),
			value: topModule.format(
				scoreTooLow
					? "lowScore"
					: `end${rankCurrentPlayer === 1 ? "First" : "Any"}${end >= rankCurrentPlayer && rankCurrentPlayer >= start ? "Right" : "Wrong"}Page`, {
					badge: getBadgePositionOfCurrentPlayer(rankCurrentPlayer),
					pseudo: actualPlayer,
					rank: rankCurrentPlayer,
					totalPlayer: numberOfPlayers,
					page: getPageOfRank(rankCurrentPlayer),
					pageMax: pageMax
				})
		});
	if (timing === TopConstants.TIMING_WEEKLY) {
		topDisplay.setFooter({
			text: topModule.format("nextReset", {
				time: parseTimeDifference(Date.now(), getNextSundayMidnight(), language)
			}),
			iconURL: TopConstants.LINK_CLOCK_FOOTER
		});
	}

	await interaction.editReply({embeds: [topDisplay]});
}

/**
 * Get the page number that will be shown to the user
 * @param interaction
 * @param pageMax
 */
function getShownPage(interaction: CommandInteraction, pageMax: number): number {
	const page = interaction.options.get(Translations.getModule("commands.top", Constants.LANGUAGE.ENGLISH).get("optionPageName"));
	if (!page) {
		return 1;
	}
	if (page.value > pageMax) {
		return pageMax;
	}
	return page.value as number;
}

/**
 * Allow to display the rankings of the players
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	await interaction.deferReply();

	const scopeUntested = interaction.options.get(Translations.getModule("commands.top", Constants.LANGUAGE.ENGLISH).get("optionScopeName"));
	const scope = scopeUntested ? scopeUntested.value as string : TopConstants.GLOBAL_SCOPE;
	const timingUntested = interaction.options.get(Translations.getModule("commands.top", Constants.LANGUAGE.ENGLISH).get("optionTimingName"));
	const timing = timingUntested ? timingUntested.value as string : TopConstants.TIMING_ALLTIME;
	const scoreTooLow = player[timing === TopConstants.TIMING_ALLTIME ? "score" : "weeklyScore"] <= Constants.MINIMAL_PLAYER_SCORE;

	const listDiscordId = scope === TopConstants.SERVER_SCOPE ? Array.from((await interaction.guild.members.fetch()).keys()) : await Players.getAllStoredDiscordIds();
	const numberOfPlayers = await Players.getNumberOfPlayingPlayersInList(listDiscordId, timing);
	const pageMax = numberOfPlayers === 0 ? 1 : getPageOfRank(numberOfPlayers);

	const page = getShownPage(interaction, pageMax);

	const rankCurrentPlayer = scoreTooLow ? numberOfPlayers + 1 : await Players.getRankFromUserList(interaction.user.id, listDiscordId, timing);

	const playersToShow = await Players.getPlayersToPrintTop(listDiscordId, page, timing);

	await displayTop({interaction, language}, {scope, timing, page, numberOfPlayers}, {
		rankCurrentPlayer,
		scoreTooLow
	}, playersToShow);
}

const currentCommandFrenchTranslations = Translations.getModule("commands.top", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.top", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addStringOption(option => option.setName(currentCommandEnglishTranslations.get("optionScopeName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionScopeName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionScopeDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionScopeDescription")
			})
			.addChoices(
				{
					name: currentCommandFrenchTranslations.get("scopes.global"),
					"name_localizations": {
						fr: currentCommandFrenchTranslations.get("scopes.global")
					}, value: TopConstants.GLOBAL_SCOPE
				},
				{
					name: currentCommandFrenchTranslations.get("scopes.server"),
					"name_localizations":
						{
							fr: currentCommandFrenchTranslations.get("scopes.server")
						}
					,
					value: TopConstants.SERVER_SCOPE
				}
			)
			.setRequired(false)
		)
		.addStringOption(option => option.setName(currentCommandEnglishTranslations.get("optionTimingName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionTimingName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionTimingDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionTimingDescription")
			})
			.addChoices(
				{
					name: currentCommandFrenchTranslations.get("timings.allTime"),
					"name_localizations": {
						fr: currentCommandFrenchTranslations.get("timings.allTime")
					}, value: TopConstants.TIMING_ALLTIME
				},
				{
					name: currentCommandFrenchTranslations.get("timings.weekly"),
					"name_localizations": {
						fr: currentCommandFrenchTranslations.get("timings.weekly")
					}, value: TopConstants.TIMING_WEEKLY
				}
			)
			.setRequired(false)
		)
		.addIntegerOption(option => option.setName(currentCommandEnglishTranslations.get("optionPageName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionPageName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionPageDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionPageDescription")
			})
			.setMinValue(1)
			.setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY]
	},
	mainGuildCommand: false
};
