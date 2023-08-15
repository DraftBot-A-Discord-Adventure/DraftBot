import {readdirSync} from "fs";
import {WitchEvent} from "./WitchEvent";
import {RandomUtils} from "../../utils/RandomUtils";
import {Constants} from "../../Constants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";

/**
 * This allows to load and manage all the witch events
 */
export class WitchEvents {
	static witchEvents: Map<string, WitchEvent> = null;

	/**
	 * Populate a map will all the witchEvents and their ids
	 */
	static initWitchEventsMap(): void {
		const files = readdirSync("dist/src/core/smallEvents/witch/interfaces");
		WitchEvents.witchEvents = new Map();
		for (const file of files) {
			if (file.endsWith(".js")) {
				const DefaultClass = require(`./interfaces/${file}`).default;
				if (!DefaultClass) {
					console.warn(`${file} doesn't have a default export`);
					return;
				}
				const witchEventName = file.substring(0, file.length - 3);
				const witchEventInstance = new DefaultClass(witchEventName);
				if (!(witchEventInstance instanceof WitchEvent)) {
					console.warn(`${file} initialized instance is incorrect`);
					return;
				}
				WitchEvents.witchEvents.set(witchEventInstance.getEmoji(), witchEventInstance);
			}
		}
	}

	/**
	 * Allow to get a specific witch event
	 * @param emoji
	 */
	static getWitchEventByEmoji(emoji: string): WitchEvent | null {
		if (!WitchEvents.witchEvents) {
			WitchEvents.initWitchEventsMap();
		}
		if (emoji === Constants.REACTIONS.NOT_REPLIED_REACTION) {
			return WitchEvents.getRandomWitchEventByType(SmallEventConstants.WITCH.ACTION_TYPE.NOTHING);
		}
		return WitchEvents.witchEvents.get(emoji);
	}

	/**
	 * Get a random witchEvent from all the possible one given a type of witchEvent (ingredient or actions)
	 * @param type
	 */
	static getRandomWitchEventByType(type: number): WitchEvent | null {
		if (!WitchEvents.witchEvents) {
			WitchEvents.initWitchEventsMap();
		}
		const possibleWitchEvents = Array.from(WitchEvents.witchEvents.values()).filter((witchEvent) => witchEvent.type === type);

		return RandomUtils.draftbotRandom.pick(possibleWitchEvents);
	}

	/**
	 * Get a random witchEvent from all the possible one
	 * @param excludedWitchEvents the witchEvents that should not be selected
	 */
	static getRandomWitchEvent(excludedWitchEvents: WitchEvent[]): WitchEvent | null {
		if (!WitchEvents.witchEvents) {
			WitchEvents.initWitchEventsMap();
		}
		const possibleWitchEvents = Array.from(WitchEvents.witchEvents.values()).filter((witchEvent) => !excludedWitchEvents.includes(witchEvent));
		return RandomUtils.draftbotRandom.pick(possibleWitchEvents);
	}
}