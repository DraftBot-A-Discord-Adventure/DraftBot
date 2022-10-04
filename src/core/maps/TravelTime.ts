import Player from "../database/game/models/Player";
import {MapLinks} from "../database/game/models/MapLink";
import {millisecondsToMinutes, minutesToMilliseconds} from "../utils/TimeUtils";
import {PlayerSmallEvents} from "../database/game/models/PlayerSmallEvent";
import {Constants} from "../Constants";
import {NumberChangeReason} from "../database/logs/LogsDatabase";
import {draftBotInstance} from "../bot";
import {EffectsConstants} from "../constants/EffectsConstants";

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
		const data = await this.getTravelDataSimplified(player, date);

		const lastSmallEvent = PlayerSmallEvents.getLast(player.PlayerSmallEvents);
		// The next small event in 10 minutes after the last small event or the start or the travel if none before
		let nextSmallEventTime = (lastSmallEvent && lastSmallEvent.time > data.travelStartTime ? lastSmallEvent.time : data.travelStartTime) + Constants.REPORT.TIME_BETWEEN_MINI_EVENTS;
		// If the next small event is in the effect period, we shift it after the end of the effect
		if (player.effectDuration !== 0 && nextSmallEventTime <= data.effectEndTime) {
			nextSmallEventTime = data.effectEndTime + Constants.REPORT.TIME_BETWEEN_MINI_EVENTS;
		}

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
	static async getTravelDataSimplified(player: Player, date: Date): Promise<{
		travelStartTime: number,
		travelEndTime: number,
		effectStartTime: number,
		effectEndTime: number,
		effectDuration: number,
		effectRemainingTime: number,
		playerTravelledTime: number
	}> {
		// Basic variables
		const travelStartTime = player.startTravelDate.valueOf();
		let effectEndTime = player.effectEndDate.valueOf();
		let effectDuration = minutesToMilliseconds(player.effectDuration);

		// Check to avoid errors. If the effect is before the travel start, move it to the beginning of the start travel
		if (effectEndTime < travelStartTime) {
			effectEndTime = travelStartTime;
		}

		// Check to avoid errors. If the effect starts before the start of the travel, cut the duration to make it begin
		// at the start of the travel
		if (effectEndTime - effectDuration < travelStartTime) {
			effectDuration = effectEndTime - travelStartTime;
		}

		// Basic variables
		const effectStartTime = effectEndTime - effectDuration;
		const tripDuration = minutesToMilliseconds((await MapLinks.getById(player.mapLinkId)).tripDuration);
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
	 */
	static async timeTravel(player: Player, time: number, reason: NumberChangeReason): Promise<void> {
		const timeMs = minutesToMilliseconds(time);

		// Move the start and effect date
		if (player.startTravelDate.valueOf() - timeMs > 0) { // Make sure we are not negative
			player.startTravelDate = new Date(player.startTravelDate.valueOf() - timeMs);
		}
		else {
			player.startTravelDate = new Date(0);
		}
		if (player.effectEndDate.valueOf() - timeMs > 0) { // Make sure we are not negative
			player.effectEndDate = new Date(player.effectEndDate.valueOf() - timeMs);
		}
		else {
			player.effectEndDate = new Date(0);
		}

		// Move the last small event
		const lastSmallEvent = PlayerSmallEvents.getLast(player.PlayerSmallEvents);
		if (lastSmallEvent) {
			lastSmallEvent.time -= timeMs;
			await lastSmallEvent.save();
		}

		// Log
		player.getEntity().then(entity => draftBotInstance.logsDatabase.logTimeWarp(entity.discordUserId, time, reason));
	}

	/**
	 * Removes the effect of a player
	 * @param player
	 * @param reason
	 */
	static async removeEffect(player: Player, reason: NumberChangeReason): Promise<void> {
		// Make the player time travel to the end of the effect
		await TravelTime.timeTravel(player, millisecondsToMinutes(player.effectRemainingTime()), reason);

		// Move the start of the travel because the effect will have a duration of 0
		player.startTravelDate = new Date(player.startTravelDate.valueOf() + minutesToMilliseconds(player.effectDuration));

		// Now we can safely remove the effect, as the player is after the effect
		player.effect = EffectsConstants.EMOJI_TEXT.SMILEY;
		player.effectDuration = 0;
		player.effectEndDate = new Date(0);

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
	static async applyEffect(player: Player, effect: string, time: number, date: Date, reason: NumberChangeReason): Promise<void> {
		// Reason is IGNORE here because you don't want to log a time warp when you get an alteration
		// First remove the effect
		await this.removeEffect(player, NumberChangeReason.IGNORE);

		// Apply the new effect
		player.effect = effect;
		if (effect === EffectsConstants.EMOJI_TEXT.OCCUPIED) {
			player.effectDuration = time;
		}
		else {
			player.effectDuration = EffectsConstants.DURATION[effect as keyof typeof EffectsConstants.DURATION];
		}
		player.effectEndDate = new Date(date.valueOf() + minutesToMilliseconds(player.effectDuration));

		// Save and log
		await player.save();
		player.getEntity().then(entity => draftBotInstance.logsDatabase.logAlteration(entity.discordUserId, effect, reason, time).then());
	}
}