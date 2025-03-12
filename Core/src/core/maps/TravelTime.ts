import Player from "../database/game/models/Player";
import {millisecondsToMinutes, minutesToMilliseconds} from "../../../../Lib/src/utils/TimeUtils";
import {PlayerSmallEvents} from "../database/game/models/PlayerSmallEvent";
import {Maps} from "./Maps";
import {PVEConstants} from "../../../../Lib/src/constants/PVEConstants";
import {MapLinkDataController} from "../../data/MapLink";
import {draftBotInstance} from "../../index";
import {Effect} from "../../../../Lib/src/types/Effect";
import { Constants } from "../../../../Lib/src/constants/Constants";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";

/**
 * Travel time functions class
 */
export class TravelTime {
	/**
	 * Understand travel time
	 *
	 * Variables :
	 * travelStart -> player.startTravelDate
	 * effectEnd -> player.effectEndDate
	 * effectDuration -> player.effectDuration
	 * effectStart -> travelStart + effectEnd - effectDuration
	 * tripDuration -> MapLink.tripDuration
	 * travelEnd -> travelStart + effectDuration + tripDuration
	 *
	 * This is a scheme of a travel trip :
	 *
	 *      [                               tripDuration                               ]
	 *                         [   effectDuration  ]
	 *
	 *      |------------------|###################|-----------------🧍‍----------------|
	 *      ^                  ^                   ^                 ^                 ^
	 *      |                  |                   |                 |                 |
	 * travelStart        effectStart          effectEnd            now            travelEnd
	 *
	 * Trivia :
	 * - In the /report interface, the effectStart to effectEnd period is hidden and if the player is in this, he is shown as stopped
	 * - Time travel moves all variables to the left (or right if going to the past)
	 */

	/**
	 * Get the travel data
	 * @param player
	 * @param date
	 */
	static async getTravelData(player: Player, date: Date): Promise<{
		travelStartTime: number,
		travelEndTime: number,
		effectStartTime: number,
		effectEndTime: number,
		effectDuration: number,
		effectRemainingTime: number,
		playerTravelledTime: number,
		nextSmallEventTime: number
	}> {
		const data = this.getTravelDataSimplified(player, date);

		const lastSmallEvent = await PlayerSmallEvents.getLastOfPlayer(player.id);
		const timeBetweenSmallEvents = Maps.isOnPveIsland(player) ? PVEConstants.TIME_BETWEEN_SMALL_EVENTS : Constants.REPORT.TIME_BETWEEN_MINI_EVENTS;
		// The next small event in 9min45 after the last thing that happened between last start of the travel, small event (if there's one since the start of the travel) and end of alteration
		const nextSmallEventTime = Math.max(
			data.travelStartTime,
			lastSmallEvent ? lastSmallEvent.time : -1,
			data.effectEndTime
		) + timeBetweenSmallEvents;

		return {
			travelStartTime: data.travelStartTime,
			travelEndTime: data.travelEndTime,
			effectStartTime: data.effectStartTime,
			effectEndTime: data.effectEndTime,
			effectDuration: data.effectDuration,
			effectRemainingTime: data.effectRemainingTime,
			playerTravelledTime: data.playerTravelledTime,
			nextSmallEventTime
		};
	}

	/**
	 * Get the travel data without the small events' data. May be useful if it is not necessary or if the player doesn't
	 * have the small events data
	 * @param player
	 * @param date
	 */
	static getTravelDataSimplified(player: Player, date: Date): {
		travelStartTime: number,
		travelEndTime: number,
		effectStartTime: number,
		effectEndTime: number,
		effectDuration: number,
		effectRemainingTime: number,
		playerTravelledTime: number
	} {
		// Basic variables
		const travelStartTime = player.startTravelDate.valueOf();
		let effectEndTime = player.effectEndDate.valueOf();
		let effectDuration = minutesToMilliseconds(player.effectDuration);

		// Check to avoid errors. If the effect is before the travel start, move it to the beginning of the start travel
		if (effectEndTime < travelStartTime) {
			effectEndTime = travelStartTime;
		}

		// Check to avoid errors. If the effect starts before the start of the travel, cut the duration to make it begin
		// At the start of the travel
		if (effectEndTime - effectDuration < travelStartTime) {
			effectDuration = effectEndTime - travelStartTime;
		}

		// Basic variables
		const effectStartTime = effectEndTime - effectDuration;
		const tripDuration = minutesToMilliseconds(MapLinkDataController.instance.getById(player.mapLinkId).tripDuration);
		const travelEndTime = travelStartTime + effectDuration + tripDuration;
		let effectRemainingTime = effectEndTime - date.valueOf();
		if (effectRemainingTime < 0) {
			effectRemainingTime = 0;
		}

		// Player travelled time
		let playerTravelledTime = date.valueOf() - travelStartTime;
		if (date.valueOf() > effectEndTime) {
			playerTravelledTime -= effectDuration;
		}
		else if (date.valueOf() > effectStartTime) {
			playerTravelledTime -= date.valueOf() - effectStartTime;
		}

		return {
			travelStartTime,
			travelEndTime,
			effectStartTime,
			effectEndTime,
			effectDuration,
			effectRemainingTime,
			playerTravelledTime
		};
	}

	/**
	 * Make a player execute a time travel
	 * Basically, all the variables are moved to the left (future positive tme) or right (past, negative time)
	 * See the scheme at the beginning of the file
	 *
	 * @param player The player
	 * @param time The time in minutes in the future (negative for the past)
	 * @param reason The reason of the time travel
	 * @param isMilliseconds
	 */
	static async timeTravel(player: Player, time: number, reason: NumberChangeReason, isMilliseconds = false): Promise<void> {
		let timeMs = isMilliseconds ? time : minutesToMilliseconds(time);
		const initialEffectEndDate = player.effectEndDate.valueOf();

		// First we have to heal the effect if it exists
		player.effectEndDate = new Date(Math.max(player.effectEndDate.valueOf() - timeMs, 0));

		// Move the start date
		player.startTravelDate = new Date(Math.max(player.startTravelDate.valueOf() - timeMs, 0));

		// Update the milliseconds to shave from small event
		if (player.effectEndDate.valueOf() < Date.now() && initialEffectEndDate > Date.now()) { // If the effect is not active anymore and was active in the first place
			timeMs -= Date.now() - player.effectEndDate.valueOf();// We only want to move the start travel date by the amount of the
		}

		if (Date.now() > player.effectEndDate.valueOf()) {
			// Move the last small event
			const lastSmallEvent = await PlayerSmallEvents.getLastOfPlayer(player.id);
			if (lastSmallEvent) {
				lastSmallEvent.time -= timeMs;
				await lastSmallEvent.save();
			}
		}

		// Log
		draftBotInstance.logsDatabase.logTimeWarp(player.keycloakId, millisecondsToMinutes(time), reason)
			.then();
	}

	/**
	 * Removes the effect of a player
	 * @param player
	 * @param reason
	 */
	static async removeEffect(player: Player, reason: NumberChangeReason): Promise<void> {
		// Make the player time travel to the end of the effect
		await TravelTime.timeTravel(player, player.effectRemainingTime(), reason, true);

		// Move the start of the travel because the effect will have a duration of 0
		player.startTravelDate = new Date(player.startTravelDate.valueOf() + minutesToMilliseconds(player.effectDuration));

		// Now we can safely remove the effect, as the player is after the effect
		player.effectId = Effect.NO_EFFECT.id;
		player.effectDuration = 0;
		player.effectEndDate = new Date();

		// Save
		await player.save();
	}

	/**
	 * Apply an effect to a player
	 * @param player
	 * @param effect
	 * @param time
	 * @param date The date of the beginning of the effect
	 * @param reason
	 */
	static async applyEffect(player: Player, effect: Effect, time: number, date: Date, reason: NumberChangeReason): Promise<void> {
		// Reason is IGNORE here because you don't want to log a time warp when you get an alteration
		// First remove the effect (if the effect is time related)
		if (player.effectId in [Effect.NO_EFFECT.id, Effect.NOT_STARTED.id, Effect.DEAD.id]) {
			await this.removeEffect(player, NumberChangeReason.IGNORE);
		}

		// Apply the new effect
		player.effectId = effect.id;
		if (effect === Effect.OCCUPIED) {
			player.effectDuration = time;
		}
		else {
			player.effectDuration = effect.timeMinutes;
		}
		player.effectEndDate = new Date(date.valueOf() + minutesToMilliseconds(player.effectDuration));

		// Save and log
		await player.save();
		draftBotInstance.logsDatabase.logAlteration(player.keycloakId, effect.id, reason, time)
			.then();
	}

	/**
	 * Calculates a score based on the time traveled
	 * @param time - time must be in minutes
	 */
	static timeTravelledToScore(time: number): number {
		let score = time + RandomUtils.draftbotRandom.integer(0, time / Constants.REPORT.BONUS_POINT_TIME_DIVIDER);
		score = score > 0 ? score : 0; // Return 0 if score is negative
		return score;
	}
}