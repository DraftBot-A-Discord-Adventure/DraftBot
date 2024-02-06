import {SmallEventFuncs} from "../../data/SmallEvent";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventDoNothingPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventDoNothingPacket";
import {Maps} from "../maps/Maps";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: (player) => Maps.isOnContinent(player) || Maps.isOnPveIsland(player),
	executeSmallEvent: (response): void => {
		response.push(makePacket(SmallEventDoNothingPacket, {}));
	}
};