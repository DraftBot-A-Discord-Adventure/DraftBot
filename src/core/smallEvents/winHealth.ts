import {SmallEventFuncs} from "../../data/SmallEvent";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {RandomUtils} from "../utils/RandomUtils";
import {NumberChangeReason} from "../constants/LogsConstants";
import {SmallEventWinHealthPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinHealthPacket";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: SmallEventConstants.DEFAULT_FUNCTIONS.CAN_BE_EXECUTED.onContinent,
	executeSmallEvent: async (response, player): Promise<void> => {
		const healthWon = RandomUtils.rangedInt(SmallEventConstants.HEALTH);
		await player.addHealth(healthWon, response, NumberChangeReason.SMALL_EVENT);
		await player.save();
		response.push(makePacket<SmallEventWinHealthPacket>({amount: healthWon}));
	}
};