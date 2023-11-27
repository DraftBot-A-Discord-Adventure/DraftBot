import {SmallEventFuncs} from "../../data/SmallEvent";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {RandomUtils} from "../utils/RandomUtils";
import {NumberChangeReason} from "../constants/LogsConstants";
import {SmallEventWinPersonnalXPPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinPersonnalXPPacket";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: SmallEventConstants.DEFAULT_FUNCTIONS.CAN_BE_EXECUTED.onContinent,
	executeSmallEvent: async (response, player): Promise<void> => {
		const xpWon = RandomUtils.rangedInt(SmallEventConstants.EXPERIENCE);
		await player.addExperience({
			amount: xpWon,
			response,
			reason: NumberChangeReason.SMALL_EVENT
		});
		await player.save();
		response.push(makePacket<SmallEventWinPersonnalXPPacket>({amount: xpWon}));
	}
};