import {Database} from "../Database";
import {getDateLogs} from "../../utils/TimeUtils";
import {LogsDailyPotions} from "./models/LogsDailyPotions";
import {LogsClassicalShopBuyouts} from "./models/LogsClassicalShopBuyouts";
import {Op} from "sequelize";
import {ShopItemType} from "../../constants/LogsConstants";

/**
 * This class is used to read some information in the log database in case it is needed for gameplay purposes
 */
export class LogsReadRequests extends Database {

	constructor() {
		super("logs");
	}

	/**
	 * Get the amount of time a specific player has bought the daily potion since the last time it was reset
	 * @param playerId
	 */
	static async getAmountOfDailyPotionsBoughtByPlayer(playerId: number): Promise<number> {
		// first we have to get the date of the last shop reset this date is stored in the daily_potions table
		const dateOfLastDailyPotionReset = await this.getDateOfLastDailyPotionReset();
		return LogsClassicalShopBuyouts.count({
			where: {
				playerId: playerId,
				date: {
					[Op.gte]: dateOfLastDailyPotionReset
				},
				shopItem: ShopItemType.DAILY_POTION
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