import { SmallEventFuncs } from "../../data/SmallEvent";
import { makePacket } from "../../../../Lib/src/packets/CrowniclesPacket";
import { Maps } from "../maps/Maps";
import { FightConstants } from "../../../../Lib/src/constants/FightConstants";
import { SmallEventLeagueRewardPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventLeagueReward";
import {
	getNextSaturdayMidnight, todayIsSunday
} from "../../../../Lib/src/utils/TimeUtils";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: player => Maps.isOnContinent(player) && player.level > FightConstants.REQUIRED_LEVEL,

	executeSmallEvent: (response, player): void => {
		const league = player.getLeague();

		response.push(makePacket(SmallEventLeagueRewardPacket, {
			rewardToday: todayIsSunday(),
			leagueId: league.id,
			money: league.getMoneyToAward(),
			xp: league.getXPToAward(),
			nextRewardDate: getNextSaturdayMidnight(),
			enoughFights: player.fightCountdown <= FightConstants.FIGHT_COUNTDOWN_MAXIMAL_VALUE
		}));
	}
};
