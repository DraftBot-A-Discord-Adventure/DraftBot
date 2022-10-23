import {Database} from "../Database";
import {getDateLogs} from "../../utils/TimeUtils";

/**
 * This class is used to read some information in the log database in case it is needed for gameplay purposes
 */
export class LogsReadRequests extends Database {

	constructor() {
		super("logs");
	};

	/**
	 * Get the amount of time a specific player has bought the daily potion since the last time it was reset
	 * @param playerId
	 */
	static async getAmountOfDailyPotionsBoughtByPlayer(playerId: string): Promise<number> {
		// first we have to get the date of the last shop reset this date is stored in the daily_potions table
		const dateOfLastDailyPotionReset = ((await this.sequelize.query("SELECT date FROM daily_potions ORDER BY date DESC LIMIT 1"))[0][0] as { date: number }).date;
		getDateLogs();
		return 1;
	}
}