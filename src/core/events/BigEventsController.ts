import {BigEvent} from "./BigEvent";
import {readdirSync} from "fs";
import {BigEventTrigger, verifyTrigger} from "./BigEventTrigger";
import {PossibilityOutcome} from "./PossibilityOutcome";
import {PossibilityCondition} from "./PossibilityCondition";
import {Possibility} from "./Possibility";
import Player from "../database/game/models/Player";
import {RandomUtils} from "../utils/RandomUtils";

// Global events map
let bigEvents: Map<number, BigEvent> = new Map<number, BigEvent>();

// Link between maps and events, to search faster
let bigEventsMaps: Map<number, BigEvent[]>;

// Events not depending of a map
let globalBigEvents: BigEvent[];

export class BigEventsController {
	/**
	 * Load the events
	 */
	static async init(): Promise<void> {
		bigEvents = new Map<number, BigEvent>();
		bigEventsMaps = new Map<number, BigEvent[]>();
		globalBigEvents = [];

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
			bigEvents.set(eventId, bigEvent);
			for (const trigger of triggers) {
				if (trigger.mapId) {
					const bigEventMap = bigEventsMaps.get(trigger.mapId) ?? [];
					bigEventMap.push(bigEvent);
					bigEventsMaps.set(trigger.mapId, bigEventMap);
				}
				else {
					globalBigEvents.push(bigEvent);
				}
			}
		}
	}

	/**
	 * Get an event from its id
	 * @param id
	 */
	static getEvent(id: number): BigEvent {
		return bigEvents.get(id);
	}

	/**
	 * Get a random event on the map
	 * @param mapId
	 * @param player
	 */
	static getRandomEvent(mapId: number, player: Player): BigEvent {
		const possibleBigEvents = globalBigEvents
			.concat(bigEventsMaps.get(mapId) ?? [])
			.filter(
				(bigEvent) => bigEvent.triggers.find(
					(trigger) => verifyTrigger(mapId, player, trigger)
				)
			);
		if (possibleBigEvents.length === 0) {
			return null;
		}
		return RandomUtils.draftbotRandom.pick(possibleBigEvents);
	}
}