import {BigEvent} from "./BigEvent";
import {readdirSync} from "fs";
import {BigEventTrigger, verifyTrigger} from "./BigEventTrigger";
import {PossibilityOutcome} from "./PossibilityOutcome";
import {PossibilityCondition} from "./PossibilityCondition";
import {Possibility} from "./Possibility";
import Player from "../database/game/models/Player";
import {RandomUtils} from "../utils/RandomUtils";

export class BigEventsController {
	/**
	 * Global events map
 	 */
	static bigEvents: Map<number, BigEvent> = new Map<number, BigEvent>();

	/**
	 * Link between maps and events, to search faster
	 */
	static bigEventsMaps: Map<number, BigEvent[]>;

	/**
	 * Events not depending of a map
	 */
	static globalBigEvents: BigEvent[];

	/**
	 * Load the events
	 */
	static async init(): Promise<void> {
		BigEventsController.bigEvents = new Map<number, BigEvent>();
		BigEventsController.bigEventsMaps = new Map<number, BigEvent[]>();
		BigEventsController.globalBigEvents = [];

		const bigEventsFiles = readdirSync("resources/text/events");
		for (const eventFile of bigEventsFiles) {
			// Event data
			const eventId = parseInt(eventFile.split(".")[0], 10);
			const eventObj = await import(`resources/text/events/${eventFile}`);
			const triggers: BigEventTrigger[] = eventObj.triggers ?? [];
			const possibilities = [];
			const eventTranslations = eventObj.translations;
			const eventTags = eventObj.tags;

			// Possibilities data
			for (const possibilityEmoji of Object.keys(eventObj.possibilities)) {
				const emoji = possibilityEmoji;
				const possibilityObj = eventObj.possibilities[possibilityEmoji];
				const outcomes: PossibilityOutcome[] = possibilityObj.outcomes;
				const condition: PossibilityCondition = possibilityObj.condition ?? null;
				const possibilityTranslations = possibilityObj.translations;
				const possibilityTags = possibilityObj.tags;
				possibilities.push(new Possibility(emoji, condition, outcomes, possibilityTranslations, possibilityTags));
			}

			// Register event and put in search maps
			const bigEvent = new BigEvent(eventId, triggers, possibilities, eventTranslations, eventTags);
			BigEventsController.bigEvents.set(eventId, bigEvent);
			for (const trigger of triggers) {
				if (trigger.mapId) {
					const bigEventMap = BigEventsController.bigEventsMaps.get(trigger.mapId) ?? [];
					if (bigEventMap.indexOf(bigEvent) === -1) {
						bigEventMap.push(bigEvent);
						BigEventsController.bigEventsMaps.set(trigger.mapId, bigEventMap);
					}
				}
				else if (BigEventsController.globalBigEvents.indexOf(bigEvent) === -1) {
					BigEventsController.globalBigEvents.push(bigEvent);
				}
			}
		}
	}

	/**
	 * Get an event from its id
	 * @param id
	 */
	static getEvent(id: number): BigEvent {
		return BigEventsController.bigEvents.get(id);
	}

	/**
	 * Get a random event on the map
	 * @param mapId
	 * @param player
	 */
	static async getRandomEvent(mapId: number, player: Player): Promise<BigEvent> {
		const possibleBigEvents = BigEventsController.globalBigEvents
			.concat(BigEventsController.bigEventsMaps.get(mapId) ?? []);
		const possibleBigEventsFiltered = [];

		for (const possibleBigEvent of possibleBigEvents) {
			for (const trigger of possibleBigEvent.triggers) {
				if (await verifyTrigger(possibleBigEvent, trigger, mapId, player)) {
					possibleBigEventsFiltered.push(possibleBigEvent);
					break;
				}
			}
		}

		if (possibleBigEventsFiltered.length === 0) {
			return null;
		}
		return RandomUtils.draftbotRandom.pick(possibleBigEventsFiltered);
	}
}