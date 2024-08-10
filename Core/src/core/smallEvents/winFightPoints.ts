import {SmallEventFuncs} from "../../data/SmallEvent";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";
import {PVEConstants} from "../../../../Lib/src/constants/PVEConstants";
import {SmallEventWinFightPointsPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinFightPointsPacket";
import {Maps} from "../maps/Maps";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: (player) => Maps.isOnPveIsland(player) && player.fightPointsLost > 0,
	executeSmallEvent: async (context, response, player): Promise<void> => {
		const maxFightPoints = player.getMaxCumulativeFightPoint();
		const amount = RandomUtils.randInt(
			Math.max(PVEConstants.FIGHT_POINTS_SMALL_EVENT.MIN_PERCENT * maxFightPoints, 1),
			PVEConstants.FIGHT_POINTS_SMALL_EVENT.MAX_PERCENT * maxFightPoints
		);
		player.addFightPoints(amount, maxFightPoints);
		await player.save();
		response.push(makePacket(SmallEventWinFightPointsPacket, {amount}));
	}
};