import {LogsDailyPotions} from "./models/LogsDailyPotions";
import {LogsClassicalShopBuyouts} from "./models/LogsClassicalShopBuyouts";
import {HasOne, Op} from "sequelize";
import {ShopItemType} from "../../constants/LogsConstants";
import {LogsDatabase} from "./LogsDatabase";
import {LogsPlayersPossibilities} from "./models/LogsPlayersPossibilities";
import {LogsPossibilities} from "./models/LogsPossibilities";
import {LogsPlayers} from "./models/LogsPlayers";
import {LogsPlayersTravels} from "./models/LogsPlayersTravels";
import {getNextSundayMidnight} from "../../utils/TimeUtils";
import {PVEConstants} from "../../constants/PVEConstants";
import {LogsMapLinks} from "./models/LogsMapLinks";

/**
 * This class is used to read some information in the log database in case it is needed for gameplay purposes
 */

export class LogsReadRequests {

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
<<<<<<< HEAD
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
				"$LogsMapLink.start$": PVEConstants.MAPS.CONTINENT_MAP,
				"$LogsMapLink.end$": PVEConstants.MAPS.ENTRY_MAP
			},
			include: [{
				model: LogsPlayers,
				association: new HasOne(LogsPlayersTravels, LogsPlayers, { sourceKey: "playerId", foreignKey: "id" })
			}, {
				model: LogsMapLinks,
				association: new HasOne(LogsPlayersTravels, LogsMapLinks, { sourceKey: "mapLinkId", foreignKey: "id" })
			}],
			col: "playerId"
		});
	}
}