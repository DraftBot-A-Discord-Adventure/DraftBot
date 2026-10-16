import { Player } from "../database/game/models/Player";
import { CrowniclesPacket } from "../../../../Lib/src/packets/CrowniclesPacket";
import { TravelTime } from "../maps/TravelTime";
import { ReportConstants } from "../../../../Lib/src/constants/ReportConstants";
import { NumberChangeReason } from "../../../../Lib/src/constants/LogsConstants";
import {
	asMinutes, dateToMs, Minute, millisecondsToMinutes, minutesToMilliseconds, msDiff
} from "../../../../Lib/src/utils/TimeUtils";
import { Locked } from "../../../../Lib/src/locks/withLockedEntities";

/**
 * Minutes spent in the city since the arrival, capped like the travel time rewarded by a report
 */
export function getRewardedCityStayMinutes(player: Player, now: Date): Minute {
	if (!player.insideCity || !player.cityArrivalDate) {
		return asMinutes(0);
	}
	const stayMinutes = millisecondsToMinutes(msDiff(dateToMs(now), dateToMs(player.cityArrivalDate)));
	return asMinutes(Math.min(Math.max(stayMinutes, 0), ReportConstants.TIME_LIMIT));
}

/**
 * Make the player leave the city and credit the points earned during the stay, with the same algorithm as the travel time of a report
 * @returns the points actually credited, blessing included
 */
export async function leaveCityUnderLock(lockedPlayer: Locked<Player>, response: CrowniclesPacket[], now: Date): Promise<number> {
	const stayMinutes = getRewardedCityStayMinutes(lockedPlayer, now);
	let creditedScore = 0;
	if (stayMinutes > 0) {
		const scoreParameters = {
			response,
			amount: TravelTime.timeTravelledToScore(minutesToMilliseconds(stayMinutes)),
			reason: NumberChangeReason.CITY_STAY
		};
		await lockedPlayer.addScore(scoreParameters);
		creditedScore = scoreParameters.amount;
	}
	lockedPlayer.insideCity = false;
	lockedPlayer.cityArrivalDate = null;
	await lockedPlayer.save();
	return creditedScore;
}
