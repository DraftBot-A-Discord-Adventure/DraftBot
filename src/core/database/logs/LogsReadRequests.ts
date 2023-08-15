import {LogsDailyPotions} from "./models/LogsDailyPotions";
import {LogsClassicalShopBuyouts} from "./models/LogsClassicalShopBuyouts";
import {HasOne, Op} from "sequelize";
import {ShopItemType} from "../../constants/LogsConstants";
import {LogsDatabase} from "./LogsDatabase";
import {LogsPlayersPossibilities} from "./models/LogsPlayersPossibilities";
import {LogsPossibilities} from "./models/LogsPossibilities";
import {LogsPlayers} from "./models/LogsPlayers";
import {LogsPlayersTravels} from "./models/LogsPlayersTravels";
import {getNextSaturdayMidnight, getNextSundayMidnight, minutesToMilliseconds} from "../../utils/TimeUtils";
import {LogsMapLinks} from "./models/LogsMapLinks";
import {MapLocations} from "../game/models/MapLocation";
import {MapConstants} from "../../constants/MapConstants";
import {LogsFightsResults} from "./models/LogsFightsResults";
import {LogsSeasonEnd} from "./models/LogsSeasonEnd";
import {LogsPlayerLeagueReward} from "./models/LogsPlayerLeagueReward";
import {LogsPlayersClassChanges} from "./models/LogsPlayersClassChanges";
import Player from "../game/models/Player";
import {MapCache} from "../../maps/MapCache";
import {PVEConstants} from "../../constants/PVEConstants";

type RankedFightResult = {
	won: number,
	lost: number,
	draw: number
};

/**
 * This class is used to read some information in the log database in case it is needed for gameplay purposes
 */

export class LogsReadRequests {

	static async getLastTimeThePlayerHasEditedHisClass(playerDiscordId: string): Promise<Date> {
		const logPlayer = await LogsDatabase.findOrCreatePlayer(playerDiscordId);
		return LogsPlayersClassChanges.findOne({
			where: {
				playerId: logPlayer.id
			},
			order: [["date", "DESC"]],
			limit: 1
		}).then((res) => new Date(res ? res.date : 0));
	}

	/**
	 * Get the amount of time a specific player has bought the daily potion since the last time it was reset
	 * @param playerDiscordId - The discord id of the player we want to check on
	 */
	static async getAmountOfDailyPotionsBoughtByPlayer(playerDiscordId: string): Promise<number> {
		const dateOfLastDailyPotionReset = await this.getDateOfLastDailyPotionReset();
		const logPlayer = await LogsDatabase.findOrCreatePlayer(playerDiscordId);
		return LogsClassicalShopBuyouts.count({
			where: {
				playerId: logPlayer.id,
				shopItem: ShopItemType.DAILY_POTION,
				date: {
					[Op.gte]: dateOfLastDailyPotionReset
				}
			}
		});
	}

	/**
	 * Get all the members of the player's guild on the pve island
	 */
	static async getGuildMembersThatWereOnPveIsland(player: Player): Promise<Player[]> {
		if (!player.guildId) { // Player has no guild
			return Promise.resolve([]);
		}
		// Get all the players in the guild excluding the player
		const playersInGuild = await Player.findAll({
			where: {
				guildId: player.guildId,
				id: {
					[Op.not]: player.id
				}
			}
		});
		// Extract ids from players
		const ids = playersInGuild.map((player) => player.discordUserId);
		// Convert the players to logs players
		const logsPlayers = await LogsPlayers.findAll({
			where: {
				discordId: {
					[Op.in]: ids
				}
			}
		});
		// Extract ids from players
		const logsPlayersIds = logsPlayers.map((logsPlayer) => logsPlayer.id);
		// Get travels from the last hours of guildsMembers
		const travelsInPveIsland = await LogsPlayersTravels.findAll({
			where: {
				mapLinkId: {
					[Op.in]: MapCache.logsPveIslandMapLinks
				},
				playerId: {
					[Op.in]: logsPlayersIds
				},
				date: {
					[Op.gt]: Math.floor((Date.now() - minutesToMilliseconds(PVEConstants.MINUTES_CHECKED_FOR_PLAYERS_THAT_WERE_ON_THE_ISLAND)) / 1000)
				}
			},
			group: ["playerId"],
			include: [{
				model: LogsPlayers,
				association: new HasOne(LogsPlayersTravels, LogsPlayers, {
					sourceKey: "playerId",
					foreignKey: "id",
					as: "LogsPlayer1"
				})
			}]
		}) as unknown as { LogsPlayer1: { discordId: string } }[];
		return await Player.findAll({
			where: {
				discordUserId: {
					[Op.in]: travelsInPveIsland.map((travelsInPveIsland) => travelsInPveIsland.LogsPlayer1.discordId)
				}
			}
		});
	}

	/**
	 * Get the date of the last daily potion reset
	 */
	static getDateOfLastDailyPotionReset(): Promise<number> {
		return LogsDailyPotions.findOne({
			order: [["date", "DESC"]]
		}).then((result) => {
			if (result) {
				return result.date;
			}
			return 0;
		});
	}

	/**
	 * Get the date of the last season reset
	 */
	static getDateOfLastSeasonReset(): Promise<number> {
		return LogsSeasonEnd.findOne({
			order: [["date", "DESC"]]
		}).then((result) => {
			if (result) {
				return result.date;
			}
			return 0;
		});
	}

	/**
	 * Get the date of the last season reset
	 */
	static async getDateOfLastLeagueReward(playerDiscordId: string): Promise<number | null> {
		const logPlayer = await LogsDatabase.findOrCreatePlayer(playerDiscordId);
		return LogsPlayerLeagueReward.findOne({
			order: [["date", "DESC"]],
			where: {
				playerId: logPlayer.id
			}
		}).then((result) => {
			if (result) {
				return result.date;
			}
			return null;
		});
	}

	/**
	 * Get the date of the last event id for the player
	 * @param discordId
	 * @param eventId
	 */
	static async getLastEventDate(discordId: string, eventId: number): Promise<Date | null> {
		// Get all possibilities id for the big event
		const possibilityIds = (await LogsPossibilities.findAll({
			where: {
				bigEventId: eventId
			}
		})).map((possibility) => possibility.id);

		// Get logs player id
		const playerId = (await LogsPlayers.findOne({
			where: {
				discordId
			}
		})).id;

		// Find the last one
		const lastEvent = await LogsPlayersPossibilities.findOne({
			order: [["date", "DESC"]],
			where: {
				possibilityId: {
					[Op.in]: possibilityIds
				},
				playerId
			}
		});

		return lastEvent ? new Date(lastEvent.date * 1000) : null;
	}

	/**
	 * Get the number of time the player went on the PVE island this week
	 * @param discordId
	 */
	static async getCountPVEIslandThisWeek(discordId: string): Promise<number> {
		return await LogsPlayersTravels.count({
			where: {
				"$LogsPlayer.discordId$": discordId,
				date: {
					[Op.gt]: Math.floor((getNextSundayMidnight() - 7 * 24 * 60 * 60 * 1000) / 1000)
				},
				"$LogsMapLink.start$": (await MapLocations.getWithAttributes([MapConstants.MAP_ATTRIBUTES.MAIN_CONTINENT]))[0].id,
				"$LogsMapLink.end$": {
					[Op.in]: (await MapLocations.getWithAttributes([MapConstants.MAP_ATTRIBUTES.PVE_ISLAND_ENTRY])).map((mapLocation) => mapLocation.id)
				}
			},
			include: [{
				model: LogsPlayers,
				association: new HasOne(LogsPlayersTravels, LogsPlayers, {sourceKey: "playerId", foreignKey: "id"})
			}, {
				model: LogsMapLinks,
				association: new HasOne(LogsPlayersTravels, LogsMapLinks, {sourceKey: "mapLinkId", foreignKey: "id"})
			}],
			col: "playerId"
		});
	}

	/*
	 * Get the fights of a player against another this week
	 * @param playerDiscordId
	 * @param opponentDiscordId
	 */
	static async getRankedFightsThisWeek(playerDiscordId: string, opponentDiscordId: string): Promise<RankedFightResult> {
		const fights = await LogsFightsResults.findAll({
			where: {
				[Op.or]: [
					{
						"$LogsPlayer1.discordId$": playerDiscordId,
						"$LogsPlayer2.discordId$": opponentDiscordId
					},
					{
						"$LogsPlayer1.discordId$": opponentDiscordId,
						"$LogsPlayer2.discordId$": playerDiscordId
					}
				],
				date: {
					[Op.gt]: Math.floor((getNextSaturdayMidnight() - 7 * 24 * 60 * 60 * 1000) / 1000)
				},
				friendly: false
			},
			include: [{
				model: LogsPlayers,
				association: new HasOne(LogsFightsResults, LogsPlayers, {
					sourceKey: "player1Id",
					foreignKey: "id",
					as: "LogsPlayer1"
				})
			}, {
				model: LogsPlayers,
				association: new HasOne(LogsFightsResults, LogsPlayers, {
					sourceKey: "player2Id",
					foreignKey: "id",
					as: "LogsPlayer2"
				})
			}]
		});

		return this.parseFightListToRankedFightData(fights);
	}

	/**
	 * Get the amount of time a specific player has bought the energy heal since the last season reset
	 * @param playerDiscordId
	 */
	static async getAmountOfHealEnergyBoughtByPlayerThisWeek(playerDiscordId: string): Promise<number> {
		const dateOfLastSeasonReset = await this.getDateOfLastSeasonReset();
		const logPlayer = await LogsDatabase.findOrCreatePlayer(playerDiscordId);
		return LogsClassicalShopBuyouts.count({
			where: {
				playerId: logPlayer.id,
				shopItem: ShopItemType.ENERGY_HEAL,
				date: {
					[Op.gte]: dateOfLastSeasonReset
				}
			}
		});
	}

	/**
	 * Parse the fights results to a ranked fight result
	 * @param fights
	 * @private
	 */
	private static parseFightListToRankedFightData(fights: LogsFightsResults[]): RankedFightResult {
		const ret = {
			won: 0,
			lost: 0,
			draw: 0
		};
		const fightersId = [];
		for (const fight of fights) {
			if (fightersId.length === 0) {
				fightersId.push(fight.player1Id);
				fightersId.push(fight.player2Id);
			}
			if (fight.winner === 0) {
				ret.draw++;
			}
			else if (fight.winner === 1 && fight.player1Id === fightersId[0] || fight.winner === 2 && fight.player2Id === fightersId[0]) {
				ret.won++;
			}
			else {
				ret.lost++;
			}
		}
		return ret;
	}
}