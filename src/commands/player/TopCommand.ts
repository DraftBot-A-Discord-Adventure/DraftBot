import {Maps} from "../../core/Maps";
import Entity, {Entities} from "../../core/models/Entity";
import {escapeUsername} from "../../core/utils/StringUtils";
import {Constants} from "../../core/Constants";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {TopConstants} from "../../core/constants/TopConstants";
import {Translations} from "../../core/Translations";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {getNextSundayMidnight, parseTimeDifference} from "../../core/utils/TimeUtils";

type TextInformations = { interaction: CommandInteraction, language: string };
type PlayerInformations = { rankCurrentPlayer: number, scoreTooLow: boolean }
type TopInformations = {
	scope: string,
	timing: string,
	page: number,
	numberOfPlayers: number
}

/**
 * Get badge state for a player in the displayed top
 * @param entityToLook
 * @param language
 */
async function getBadgeStateOfPlayer(entityToLook: Entity, language: string): Promise<string> {
	if (Date.now() < entityToLook.Player.effectEndDate.valueOf()) {
		return entityToLook.Player.effect;
	}
	if (entityToLook.Player.isInactive()) {
		return TopConstants.INACTIVE_BADGE;
	}
	if (await Maps.isArrived(entityToLook.Player)) {
		return (await entityToLook.Player.getDestination()).getEmote(language);
	}
	return "";

}

/**
 * Get the badge for a player in the displayed top
 * @param interaction
 * @param entityToLook
 * @param page
 * @param rank
 */
function getBadgeTopPositionOfPlayer(interaction: CommandInteraction, entityToLook: Entity, page: number, rank: number): string {
	if (interaction.user.id === entityToLook.discordUserId) {
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
	if (interaction.guild.members.cache.find(user => user.id === entityToLook.discordUserId)) {
		return TopConstants.TOP_POSITION_BADGE.BLUE;
	}
	return TopConstants.TOP_POSITION_BADGE.BLACK;
}

/**
 * Get the badge for the position of the current player
 * @param rankCurrentPlayer
 */
function getBadgePositionOfCurrentPlayer(rankCurrentPlayer: number) {
	return rankCurrentPlayer === 0
		? TopConstants.TOP_POSITION_BADGE.FIRST
		: rankCurrentPlayer === 1
			? TopConstants.TOP_POSITION_BADGE.SECOND
			: rankCurrentPlayer === 2
				? TopConstants.TOP_POSITION_BADGE.THIRD
				: TopConstants.TOP_POSITION_BADGE.BLACK;
}

/**
 * Get the page where the rank will appear
 * @param rank
 */
function getPageOfRank(rank: number) {
	return Math.ceil(rank / TopConstants.PLAYERS_BY_PAGE);
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
 * @param entitiesToShow
 */
async function displayTop(
	{interaction, language}: TextInformations,
	{scope, timing, page, numberOfPlayers}: TopInformations,
	{rankCurrentPlayer, scoreTooLow}: PlayerInformations,
	entitiesToShow: Entity[]) {
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
	let description = "";
	for (let rank = 0; rank < entitiesToShow.length; rank++) {
		description = description.concat(topModule.format("playerRankLine", {
			badge: getBadgeTopPositionOfPlayer(interaction, entitiesToShow[rank], page, rank),
			rank: start + rank,
			pseudo: await entitiesToShow[rank].Player.getPseudo(language),
			badgeState: await getBadgeStateOfPlayer(entitiesToShow[rank], language),
			score: timing === TopConstants.TIMING_WEEKLY
				? entitiesToShow[rank].Player.weeklyScore
				: entitiesToShow[rank].Player.score,
			level: entitiesToShow[rank].Player.level
		}));
	}
	topDisplay.setDescription(description)
		.addField(
			topModule.get("yourRanking"),
			topModule.format(
				scoreTooLow
					? "lowScore"
					: `end${rankCurrentPlayer === 1 ? "First" : "Any"}${end >= rankCurrentPlayer && rankCurrentPlayer >= start ? "Right" : "Wrong"}Page`, {
					badge: getBadgePositionOfCurrentPlayer(rankCurrentPlayer),
					pseudo: actualPlayer,
					rank: rankCurrentPlayer,
					totalPlayer: numberOfPlayers,
					page: getPageOfRank(rankCurrentPlayer),
					pageMax: pageMax
				}));
	if (timing === TopConstants.TIMING_WEEKLY) {
		topDisplay.setFooter(
			topModule.format("nextReset", {
				time: parseTimeDifference(Date.now(), getNextSundayMidnight(), language)
			}), TopConstants.LINK_CLOCK_FOOTER
		);
	}

	await (scope === TopConstants.SERVER_SCOPE ? interaction.editReply({embeds: [topDisplay]}) : interaction.reply({embeds: [topDisplay]}));
}

/**
 * Allow to display the rankings of the players
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity) {
	const scoreTooLow = entity.Player.score <= Constants.MINIMAL_PLAYER_SCORE;
	let page = interaction.options.getInteger("page");
	if (page < 1 || isNaN(page)) {
		page = 1;
	}

	const scope = interaction.options.getString("scope") ? interaction.options.getString("scope") : TopConstants.GLOBAL_SCOPE;
	const timing = interaction.options.getString("timing") ? interaction.options.getString("timing") : TopConstants.TIMING_ALLTIME;

	if (scope === TopConstants.SERVER_SCOPE) {
		interaction.deferReply();
	}

	const listDiscordId = scope === TopConstants.SERVER_SCOPE ? Array.from((await interaction.guild.members.fetch()).keys()) : await Entities.getAllStoredDiscordIds();
	const numberOfPlayers = await Entities.getNumberOfPlayingPlayersInList(listDiscordId, timing);

	const pageMax = numberOfPlayers === 0 ? 1 : getPageOfRank(numberOfPlayers);
	if (page > pageMax) {
		page = pageMax;
	}

	const rankCurrentPlayer = await Entities.getRankFromUserList(interaction.user.id, listDiscordId, timing);

	const entitiesToShow = await Entities.getEntitiesToPrintTop(listDiscordId, page, timing);

	await displayTop({interaction, language}, {scope, timing, page, numberOfPlayers}, {
		rankCurrentPlayer,
		scoreTooLow
	}, entitiesToShow);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("top")
		.setDescription("Display the current top")
		.addStringOption(option => option.setName("scope")
			.setDescription("Which scope are you looking for the top")
			.addChoice("Global", TopConstants.GLOBAL_SCOPE)
			.addChoice("Server", TopConstants.SERVER_SCOPE)
			.setRequired(false)
		)
		.addStringOption(option => option.setName("timing")
			.setDescription("Alltime top or weekly top")
			.addChoice("Alltime", TopConstants.TIMING_ALLTIME)
			.addChoice("Week", TopConstants.TIMING_WEEKLY)
			.setRequired(false)
		)
		.addIntegerOption(option => option.setName("page")
			.setDescription("Page you want to look in the top")
			.setMinValue(1)
			.setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY]
	},
	mainGuildCommand: false
};
