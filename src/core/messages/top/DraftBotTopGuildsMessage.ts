import {DraftBotTopMessage, TopBadgeColorEnum, TopData, TopElement} from "./DraftBotTopMessage";
import {Guild, Guilds} from "../../database/game/models/Guild";
import Player from "../../database/game/models/Player";
import {TranslationModule, Translations} from "../../Translations";
import {TopConstants} from "../../constants/TopConstants";
import {TextInformation} from "../../utils/MessageUtils";

export class DraftBotTopGuildsMessage extends DraftBotTopMessage {
	private readonly _player: Player;

	private readonly _topTrModule: TranslationModule;


	constructor(textInformation: TextInformation, player: Player, pageNumber: number) {
		const topTrModule = Translations.getModule("commands.top", textInformation.language);

		super({
			pageNumber,
			pageSize: TopConstants.GUILDS_PER_PAGE
		}, {
			language: textInformation.language,
			title: topTrModule.get("guilds.title"),
			noElementMessage: topTrModule.get("guilds.nobodyInTop"),
			rankTextTitle: topTrModule.get("guilds.rankingTitle"),
			footerIcon: null,
			footerText: null
		});
		this._player = player;
		this._topTrModule = topTrModule;
	}

	private getTopElements(guilds: Guild[]): TopElement[] {
		const elements: TopElement[] = [];

		for (const guild of guilds) {
			elements.push({
				name: guild.name,
				badge: TopBadgeColorEnum.NO_COLOR,
				attributes: [{
					value: guild.score.toString(),
					formatted: true
				},
				{
					value: this._topTrModule.format("levelAttribute", {
						level: guild.level
					}),
					formatted: true
				}]
			});
		}

		return elements;
	}

	private getRankText(guildRank: number, minRank: number, maxRank: number, totalRanks: number): string {
		let message;
		if (guildRank === TopConstants.TOP_GUILD_NOT_RANKED_REASON.ZERO_POINTS) {
			message = "guilds.lowScore";
		}
		else if (guildRank === TopConstants.TOP_GUILD_NOT_RANKED_REASON.NO_GUILD) {
			message = "guilds.noGuild";
		}
		else {
			message = `guilds.end${guildRank === 1 ? "First" : "Any"}${maxRank >= guildRank && guildRank >= minRank ? "Right" : "Wrong"}Page`;
		}

		return this._topTrModule.format(message, {
			badge: this.getBadge(guildRank, -1, TopBadgeColorEnum.NO_COLOR),
			pseudo: this._player.getPseudo(this._topTrModule.language),
			rank: guildRank,
			totalGuilds: totalRanks,
			page: this._pageNumber,
			pageMax: Math.ceil(totalRanks / this._pageSize)
		});
	}

	getTotalElements(): Promise<number> {
		return Guilds.getTotalRanked();
	}

	async getTopData(minRank: number, maxRank: number, totalRanks: number): Promise<TopData> {
		const rankedGuilds = await Guilds.getRankedGuilds(minRank, maxRank);
		const playerGuild = await Guilds.getById(this._player.guildId);
		const playerGuildRank = playerGuild ? await playerGuild.getRanking() : TopConstants.TOP_GUILD_NOT_RANKED_REASON.NO_GUILD;

		return {
			topElements: this.getTopElements(rankedGuilds),
			elementRank: playerGuildRank,
			rankText: this.getRankText(playerGuildRank, minRank, maxRank, totalRanks)
		};
	}
}