import {SmallEventConstants} from "../constants/SmallEventConstants";
import {SmallEventFuncs} from "../../data/SmallEvent";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: SmallEventConstants.DEFAULT_FUNCTIONS.CAN_BE_EXECUTED.onContinent || SmallEventConstants.DEFAULT_FUNCTIONS.CAN_BE_EXECUTED.onPveIsland,
	executeSmallEvent: (): void => {}
};