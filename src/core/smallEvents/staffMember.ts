import {SmallEventConstants} from "../constants/SmallEventConstants";
import {SmallEventFuncs} from "../../data/SmallEvent";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventStaffMemberPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventStaffMemberPacket";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: SmallEventConstants.DEFAULT_FUNCTIONS.CAN_BE_EXECUTED.CONTINENT,
	executeSmallEvent: (response): void => {
		response.push(makePacket<SmallEventStaffMemberPacket>({}));
	}
};