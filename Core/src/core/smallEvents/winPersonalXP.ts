import {SmallEventFuncs} from "../../data/SmallEvent";
import {SmallEventConstants} from "../../../../Lib/src/constants/SmallEventConstants";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {RandomUtils} from "../utils/RandomUtils";
import {SmallEventWinPersonalXPPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinPersonalXPPacket";
import {Maps} from "../maps/Maps";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: Maps.isOnContinent,
	executeSmallEvent: async (context, response, player): Promise<void> => {
		const xpWon = RandomUtils.rangedInt(SmallEventConstants.EXPERIENCE);
		await player.addExperience({
			amount: xpWon,
			response,
			reason: NumberChangeReason.SMALL_EVENT
		});
		await player.save();
		response.push(makePacket(SmallEventWinPersonalXPPacket, {amount: xpWon}));
	}
};