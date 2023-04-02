import {SimpleTextSmallEvent} from "./SimpleTextSmallEvent";
import {Maps} from "../maps/Maps";
import Player from "../database/game/models/Player";

/**
 * @class DoNothingSmallEvent
 */
class DoNothingSmallEvent extends SimpleTextSmallEvent {
	canBeExecuted = (player: Player): Promise<boolean> => Promise.resolve(Maps.isOnContinent(player) || Maps.isOnPveIsland(player));
}

export const smallEvent: DoNothingSmallEvent = new DoNothingSmallEvent("doNothing");