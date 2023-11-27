import {SmallEventFuncs} from "../../data/SmallEvent";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {SmallEventBoatAdvicePacket} from "../../../../Lib/src/packets/smallEvents/SmallEventBoatAdvicePacket";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";

export const smallEventFuncs: SmallEventFuncs = {
    canBeExecuted: (player) => SmallEventConstants.DEFAULT_FUNCTIONS.CAN_BE_EXECUTED.onBoat(player),
    executeSmallEvent: async (response, player): Promise<void> => {
        response.push(makePacket<SmallEventBoatAdvicePacket>({}));
    }
};