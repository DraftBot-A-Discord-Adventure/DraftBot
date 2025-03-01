import {SmallEventFuncs} from "../../data/SmallEvent";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";
import {PVEConstants} from "../../../../Lib/src/constants/PVEConstants";
import {SmallEventWinFightPointsPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinFightPointsPacket";
import {Maps} from "../maps/Maps";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: (player) => Maps.isOnPveIsland(player) && player.fightPointsLost > 0,
	executeSmallEvent: async (response, player): Promise<void> => {
		const maxFightPoints = player.getMaxCumulativeEnergy();
		const amount = RandomUtils.randInt(
			Math.max(PVEConstants.FIGHT_POINTS_SMALL_EVENT.MIN_PERCENT * maxFightPoints, 1),
			PVEConstants.FIGHT_POINTS_SMALL_EVENT.MAX_PERCENT * maxFightPoints
		);
		player.addEnergy(amount,NumberChangeReason.SMALL_EVENT);
		await player.save();
		response.push(makePacket(SmallEventWinFightPointsPacket, {amount}));
	}
};