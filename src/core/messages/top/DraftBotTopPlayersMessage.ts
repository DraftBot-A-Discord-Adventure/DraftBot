import {DraftBotTopMessage, TopBadgeColorEnum, TopData, TopElement} from "./DraftBotTopMessage";
import {Player, Players} from "../../database/game/models/Player";
import {Constants} from "../../Constants";
import {TranslationModule, Translations} from "../../Translations";
import {TopConstants} from "../../constants/TopConstants";
import {Maps} from "../../maps/Maps";
import {getNextSundayMidnight, parseTimeDifferenceFooter} from "../../utils/TimeUtils";
import {FightConstants} from "../../constants/FightConstants";
import {TextInformation} from "../../utils/MessageUtils";
import {DraftbotInteraction} from "../DraftbotInteraction";

/**
 * Players top data type
 */
export enum TopDataType {
	SCORE = "Score",
	GLORY = "Glory"
}

/**
 * Players top scope
 */
export enum TopScope {
	GLOBAL = "Global",
	SERVER = "Server"
}

/**
 * Players top timing
 */
export enum TopTiming {
	ALL_TIME = "AllTime",
	WEEK = "Week"
}

/**
 * Parameters of the players top
 */
export type TopParameters = {
	dataType: TopDataType,
	scope: TopScope,
	timing: TopTiming
};

export class DraftBotTopPlayersMessage extends DraftBotTopMessage {
	private readonly _interaction: DraftbotInteraction;

	private readonly _topTrModule: TranslationModule;

	private readonly _dataType: TopDataType;

	private readonly _scope: TopScope;

	private readonly _timing: TopTiming;

	private readonly _player: Player;

	private _listDiscordId: string[];

	/**
	 * Build a players top message
	 * @param textInformation Text info
	 * @param topParameters Top parameters
	 * @param player The initiator of the command
	 * @param page The page to show
	 */
	constructor(textInformation: TextInformation, topParameters: TopParameters, player: Player, page: number) {
		const topTrModule = Translations.getModule("commands.top", textInformation.language);

		let title;
		if (topParameters.dataType === TopDataType.GLORY) {
			title = `topGlory${topParameters.scope}Title`;
		} else {
			title = `top${topParameters.dataType}${topParameters.timing}${topParameters.scope}Title`;
		}

		super({
			pageNumber: page,
			pageSize: TopConstants.PLAYERS_PER_PAGE
		}, {
			language: topTrModule.language,
			title: topTrModule.get(title),
			noElementMessage: topTrModule.get("nobodyInTop"),
			rankTextTitle: topTrModule.get("yourRanking"),
			footerIcon: TopConstants.LINK_CLOCK_FOOTER,
			footerText: topParameters.timing === TopTiming.WEEK ? topTrModule.format("nextReset", {
				time: parseTimeDifferenceFooter(Date.now(), getNextSundayMidnight(), textInformation.language)
			}) : null
		});

		this._interaction = textInformation.interaction;
		this._topTrModule = topTrModule;
		this._dataType = topParameters.dataType;
		this._scope = topParameters.scope;
		this._timing = topParameters.timing;
		this._dataType = topParameters.dataType;
		this._player = player;
	}

	async getTotalElements(): Promise<number> {
		await this.populateDiscordIds();
		return this._dataType === TopDataType.GLORY ?
			await Players.getNumberOfFightingPlayersInList(this._listDiscordId) :
			await Players.getNumberOfPlayingPlayersInList(this._listDiscordId, this._timing === TopTiming.WEEK);
	}

	async getTopData(minRank: number, maxRank: number, totalRanks: number): Promise<TopData> {
		await this.populateDiscordIds();

		const weekOnly = this._timing === TopTiming.WEEK;
		const gloryTop = this._dataType === TopDataType.GLORY;

		const isPlayerScoreTooLow = gloryTop ?
			this._player.fightCountdown > FightConstants.FIGHT_COUNTDOWN_MAXIMAL_VALUE :
			this._player[weekOnly ? "weeklyScore" : "score"] <= Constants.MINIMAL_PLAYER_SCORE;

		const playerRank = isPlayerScoreTooLow ?
			-1 :
			await Players.getRankFromUserList(
				this._player.discordUserId,
				this._listDiscordId,
				weekOnly,
				this._dataType === TopDataType.GLORY
			);

		const rankedPlayers = gloryTop ?
			await Players.getPlayersToPrintGloryTop(this._listDiscordId, minRank, maxRank) :
			await Players.getPlayersToPrintTop(this._listDiscordId, minRank, maxRank, weekOnly);

		return {
			topElements: gloryTop ?
				await this.buildTopElementsListGlory(rankedPlayers) :
				await this.buildTopElementsListScore(rankedPlayers),
			elementRank: playerRank,
			rankText: this.getRankText(playerRank, minRank, maxRank, totalRanks)
		};
	}

	/**
	 * Create the discord IDs list
	 * @private
	 */
	private async populateDiscordIds(): Promise<void> {
		if (!this._listDiscordId) {
			this._listDiscordId = this._scope === TopScope.SERVER ?
				Array.from((await this._interaction.guild.members.fetch()).keys()) :
				await Players.getAllStoredDiscordIds();
		}
	}

	/**
	 * Get the state badge of a player
	 * @param playerToLook
	 * @param language
	 * @param date
	 * @private
	 */
	private async getBadgeStateOfPlayer(playerToLook: Player, language: string, date: Date): Promise<string> {
		if (date.valueOf() < playerToLook.effectEndDate.valueOf()) {
			return playerToLook.effect;
		}

		// The start travel date is 0 when the event waits for a reaction
		if (playerToLook.isInactive() && playerToLook.startTravelDate.valueOf() !== 0) {
			return TopConstants.INACTIVE_BADGE;
		}

		if (await Maps.isArrived(playerToLook, date)) {
			return (await playerToLook.getDestination()).getEmote(language);
		}

		return "";

	}

	/**
	 * Build top score elements
	 * @param rankedPlayers Players to show in the top
	 * @private
	 */
	private async buildTopElementsListScore(rankedPlayers: Player[]): Promise<TopElement[]> {
		const elements: TopElement[] = [];

		for (const rankedPlayer of rankedPlayers) {
			const totalScore = (this._timing === TopTiming.WEEK ? rankedPlayer.weeklyScore : rankedPlayer.score).toString();
			const level = this._topTrModule.format("levelAttribute", {
				level: rankedPlayer.level
			});
			const state = await this.getBadgeStateOfPlayer(rankedPlayer, this._topTrModule.language, this._interaction.createdAt);
			const badge = this._scope === TopScope.SERVER ||
			this._interaction.guild.members.cache.find(user => user.id === rankedPlayer.discordUserId) ?
				TopBadgeColorEnum.BLUE :
				TopBadgeColorEnum.NO_COLOR;

			elements.push({
				name: rankedPlayer.getPseudo(this._topTrModule.language),
				attributes: state.length === 0 ? [
					{value: totalScore, formatted: true},
					{value: level, formatted: true}
				] : [
					{value: state, formatted: false},
					{value: totalScore, formatted: true},
					{value: level, formatted: true}
				],
				badge
			});
		}

		return elements;
	}

	/**
	 * Build top glory elements
	 * @param rankedPlayers Players to show in the top
	 * @private
	 */
	private async buildTopElementsListGlory(rankedPlayers: Player[]): Promise<TopElement[]> {
		const elements: TopElement[] = [];

		for (const rankedPlayer of rankedPlayers) {
			const totalScore = rankedPlayer.gloryPoints.toString();
			const leagueBadge = (await rankedPlayer.getLeague()).emoji;
			const level = this._topTrModule.format("levelAttribute", {
				level: rankedPlayer.level
			});
			const badge = this._scope === TopScope.SERVER ||
			this._interaction.guild.members.cache.find(user => user.id === rankedPlayer.discordUserId) ?
				TopBadgeColorEnum.BLUE :
				TopBadgeColorEnum.NO_COLOR;

			elements.push({
				name: rankedPlayer.getPseudo(this._topTrModule.language),
				attributes: [
					{value: leagueBadge, formatted: false},
					{value: totalScore, formatted: true},
					{value: level, formatted: true}
				],
				badge
			});
		}

		return elements;
	}

	/**
	 * Get the player's rank text
	 * @param playerRank
	 * @param minRank
	 * @param maxRank
	 * @param totalRanks
	 * @private
	 */
	private getRankText(playerRank: number, minRank: number, maxRank: number, totalRanks: number): string {
		let message;
		if (playerRank === -1) {
			if (this._dataType === TopDataType.GLORY) {
				message = "notEnoughRankedFight";
			} else {
				message = "lowScore";
			}
		} else {
			message = `end${playerRank === 1 ? "First" : "Any"}${maxRank >= playerRank && playerRank >= minRank ? "Right" : "Wrong"}Page`;
		}

		return this._topTrModule.format(message, {
			badge: this.getBadge(playerRank, -1, TopBadgeColorEnum.NO_COLOR),
			pseudo: this._player.getPseudo(this._topTrModule.language),
			rank: playerRank,
			totalPlayer: totalRanks,
			page: Math.ceil(playerRank / this._pageSize),
			pageMax: Math.ceil(totalRanks / this._pageSize),
			needFight: this._player.fightCountdown - FightConstants.FIGHT_COUNTDOWN_MAXIMAL_VALUE
		});
	}
}