import {Database} from "../Database";
import {LogsDailyPotions} from "./models/LogsDailyPotions";
import {LogsClassicalShopBuyouts} from "./models/LogsClassicalShopBuyouts";
import {Op} from "sequelize";
import {ShopItemType} from "../../constants/LogsConstants";
import {LogsDatabase} from "./LogsDatabase";

/**
 * This class is used to read some information in the log database in case it is needed for gameplay purposes
 */
export class LogsReadRequests extends Database {

	constructor() {
		super("logs");
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
}