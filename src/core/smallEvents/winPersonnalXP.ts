import {SmallEventFuncs} from "../../data/SmallEvent";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {RandomUtils} from "../utils/RandomUtils";
import {NumberChangeReason} from "../constants/LogsConstants";
import {SmallEventWinPersonalXPPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinPersonalXPPacket";
import {Maps} from "../maps/Maps";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: Maps.isOnContinent,
	executeSmallEvent: async (response, player): Promise<void> => {
		const xpWon = RandomUtils.rangedInt(SmallEventConstants.EXPERIENCE);
		await player.addExperience({
			amount: xpWon,
			response,
			reason: NumberChangeReason.SMALL_EVENT
		});
		await player.save();
		response.push(makePacket<SmallEventWinPersonalXPPacket>(SmallEventWinPersonalXPPacket, {amount: xpWon}));
	}
};