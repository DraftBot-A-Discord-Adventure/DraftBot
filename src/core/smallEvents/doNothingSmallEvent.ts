import {SimpleTextSmallEvent} from "./SimpleTextSmallEvent";

/**
 * @class DoNothingSmallEvent
 */
class DoNothingSmallEvent extends SimpleTextSmallEvent {
	canBeExecuted = (): Promise<boolean> => Promise.resolve(true);
}

export const smallEvent: DoNothingSmallEvent = new DoNothingSmallEvent("doNothing");