import Player from "../database/game/models/Player";
import {MapLinks} from "../database/game/models/MapLink";
import {millisecondsToMinutes, minutesToMilliseconds} from "../utils/TimeUtils";
import {PlayerSmallEvents} from "../database/game/models/PlayerSmallEvent";
import {Constants} from "../Constants";
import {NumberChangeReason} from "../constants/LogsConstants";
import {draftBotInstance} from "../bot";
import {EffectsConstants} from "../constants/EffectsConstants";
import {Maps} from "./Maps";
import {PVEConstants} from "../constants/PVEConstants";
import {generateTravelNotification, sendNotificationToPlayer} from "../utils/MessageUtils";

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

		const lastSmallEvent = await PlayerSmallEvents.getLastOfPlayer(player.id);
		const timeBetweenSmallEvents = Maps.isOnPveIsland(player) ? PVEConstants.TIME_BETWEEN_SMALL_EVENTS : Constants.REPORT.TIME_BETWEEN_MINI_EVENTS;
		// The next small event in 9min45 after the last thing that happened between last start of the travel, small event (if there's one since the start of the travel) and end of alteration
		const nextSmallEventTime = Math.max(
			data.travelStartTime,
			lastSmallEvent ? lastSmallEvent.time : -1,
			data.effectEndTime) + timeBetweenSmallEvents;

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
			timeMs -= Date.now() - player.effectEndDate.valueOf();// we only want to move the start travel date by the amount of the
		}

		if (Date.now() > player.effectEndDate.valueOf()) {
			// Move the last small event
			const lastSmallEvent = await PlayerSmallEvents.getLastOfPlayer(player.id);
			if (lastSmallEvent) {
				lastSmallEvent.time -= timeMs;
				await lastSmallEvent.save();
			}
		}
		const date = new Date();
		const playerEndTime = (await TravelTime.getTravelDataSimplified(player, date)).travelEndTime;
		if (playerEndTime <= date.valueOf() && playerEndTime >= date.valueOf() - timeMs) { // check if the player arrived with this potion
			await sendNotificationToPlayer(player,
				await generateTravelNotification(player)
				, Constants.LANGUAGE.ENGLISH);
		}
		// Log
		draftBotInstance.logsDatabase.logTimeWarp(player.discordUserId, millisecondsToMinutes(time), reason).then();
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
		player.effect = EffectsConstants.EMOJI_TEXT.SMILEY;
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
	static async applyEffect(player: Player, effect: string, time: number, date: Date, reason: NumberChangeReason): Promise<void> {
		// Reason is IGNORE here because you don't want to log a time warp when you get an alteration
		// First remove the effect (if the effect is time related)
		if (![EffectsConstants.EMOJI_TEXT.SMILEY, EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD].includes(player.effect)) {
			await this.removeEffect(player, NumberChangeReason.IGNORE);
		}

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
		draftBotInstance.logsDatabase.logAlteration(player.discordUserId, effect, reason, time).then();
	}
}