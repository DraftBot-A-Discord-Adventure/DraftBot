import {SmallEventFuncs} from "../../data/SmallEvent";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {RandomUtils} from "../utils/RandomUtils";
import {PVEConstants} from "../constants/PVEConstants";
import {SmallEventWinFightPointsPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinFightPointsPacket";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: (player) => SmallEventConstants.DEFAULT_FUNCTIONS.CAN_BE_EXECUTED.onPveIsland(player) && player.fightPointsLost > 0,
	executeSmallEvent: async (response, player): Promise<void> => {
		const maxFightPoints = player.getMaxCumulativeFightPoint();
		const amount = RandomUtils.randInt(
			Math.max(PVEConstants.FIGHT_POINTS_SMALL_EVENT.MIN_PERCENT * maxFightPoints, 1),
			PVEConstants.FIGHT_POINTS_SMALL_EVENT.MAX_PERCENT * maxFightPoints
		);
		player.addFightPoints(amount, maxFightPoints);
		await player.save();
		response.push(makePacket<SmallEventWinFightPointsPacket>({amount}));
	}
};