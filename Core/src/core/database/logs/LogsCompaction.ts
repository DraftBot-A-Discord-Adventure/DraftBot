import { QueryInterface } from "sequelize";
import { getWeekNumber } from "../../../../../Lib/src/utils/TimeUtils";

export abstract class LogsCompaction {
	static async preVersion5Compaction(context: QueryInterface): Promise<void> {
		const oneYearAndOneWeekAgo = new Date(Date.now() - (365 + 7) * 24 * 60 * 60 * 1000);
		const year = oneYearAndOneWeekAgo.getFullYear();
		const weekNumber = getWeekNumber(oneYearAndOneWeekAgo) - 1;
		const dateTimestamp = oneYearAndOneWeekAgo.valueOf() / 1000;

		await context.sequelize.query(
			"INSERT INTO players_commands_stats(playerId, originId, subOriginId, commandId, year, week, count)"
			+ " SELECT playerId, 1, serverId, commandId, YEAR(FROM_UNIXTIME(date)), WEEK(FROM_UNIXTIME(date)), COUNT(*)" // Discord origin is 1 because only discord exists before version 5
			+ " FROM players_commands"
			+ ` WHERE date <= ${dateTimestamp} OR (WEEK(FROM_UNIXTIME(date)) = ${weekNumber} AND YEAR(FROM_UNIXTIME(date)) = ${year})`
			+ " GROUP BY playerId, serverId, commandId, YEAR(FROM_UNIXTIME(date)), WEEK(FROM_UNIXTIME(date))"
		);

		await context.sequelize.query(
			"DELETE FROM players_commands"
			+ ` WHERE date <= ${dateTimestamp} OR (WEEK(FROM_UNIXTIME(date)) = ${weekNumber} AND YEAR(FROM_UNIXTIME(date)) = ${year})`
		);
	}
}
