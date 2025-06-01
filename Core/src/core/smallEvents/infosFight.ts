import { SmallEventFuncs } from "../../data/SmallEvent";
import { Maps } from "../maps/Maps";
import { SmallEventInfosFightPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventInfosFightPacket";
import { makePacket } from "../../../../Lib/src/packets/DraftBotPacket";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: player => Maps.isOnContinent(player),
	executeSmallEvent: (response): void => {
		response.push(makePacket(SmallEventInfosFightPacket, {}));
	}
};
