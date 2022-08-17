import MapLink, {MapLinks} from "./database/game/models/MapLink";
import {MapLocations} from "./database/game/models/MapLocation";
import Player from "./database/game/models/Player";
import {Constants} from "./Constants";
import {
	hoursToMilliseconds,
	hoursToMinutes,
	millisecondsToHours,
	millisecondsToMinutes,
	minutesToMilliseconds
} from "./utils/TimeUtils";
import {Data} from "./Data";
import {PlayerSmallEvents} from "./database/game/models/PlayerSmallEvent";
import {draftBotInstance} from "./bot";
import {NumberChangeReason} from "./database/logs/LogsDatabase";

export class Maps {

	/**
	 * Returns the map ids a player can go to. It excludes the map the player is coming from if at least one map is available
	 * @param {Players} player
	 * @param {string|String} restrictedMapType
	 * @returns {Number[]}
	 */
	static async getNextPlayerAvailableMaps(player: Player, restrictedMapType: string): Promise<number[]> {
		if (!player.mapLinkId) {
			player.mapLinkId = (await MapLinks.getRandomLink()).id;
		}

		const map = await player.getDestinationId();
		const previousMap = await player.getPreviousMapId();

		const nextMaps = [];

		const nextMapIds = await MapLocations.getMapConnected(map, previousMap, restrictedMapType);
		for (const m of nextMapIds) {
			nextMaps.push(m.id);
		}

		if (nextMaps.length === 0 && previousMap) {
			nextMaps.push(previousMap);
		}
		return nextMaps;
	}

	/**
	 * Get if the player is currently travelling between 2 maps
	 * @param {Players} player
	 * @returns {boolean}
	 */
	static isTravelling(player: Player): boolean {
		return player.startTravelDate.valueOf() !== 0;
	}

	/**
	 * Get the time in ms the player is travelling
	 * @param {Players} player
	 * @returns {number}
	 */
	static getTravellingTime(player: Player): number {
		if (!this.isTravelling(player)) {
			return 0;
		}
		const malus = player.currentEffectFinished() ? 0 : Date.now() - player.effectEndDate.valueOf();
		return Date.now() - player.startTravelDate.valueOf() - malus;
	}


	static async applyEffect(player: Player, effect: string, time: number, reason: NumberChangeReason): Promise<void> {
		await this.removeEffect(player);
		player.effect = effect;
		if (effect === Constants.EFFECT.OCCUPIED) {
			player.effectDuration = time;
		}
		else {
			player.effectDuration = millisecondsToMinutes(Data.getModule("models.players").getNumber("effectMalus." + effect));
		}
		player.effectEndDate = new Date(Date.now() + minutesToMilliseconds(player.effectDuration));
		player.startTravelDate = new Date(player.startTravelDate.valueOf() + minutesToMilliseconds(player.effectDuration));
		await player.save();
		draftBotInstance.logsDatabase.logAlteration((await player.getEntity()).discordUserId, effect, reason, time).then();
	}

	static async removeEffect(player: Player): Promise<void> {
		const remainingTime = player.effectRemainingTime();
		player.effect = Constants.EFFECT.SMILEY;
		player.effectDuration = 0;
		player.effectEndDate = new Date();
		if (remainingTime > 0) {
			await this.advanceTime(player, millisecondsToMinutes(remainingTime));
		}
		await player.save();
	}

	static async advanceTime(player: Player, time: number): Promise<void> {
		const t = minutesToMilliseconds(time);
		if (player.effectRemainingTime() !== 0) {
			if (t >= player.effectEndDate.valueOf() - Date.now()) {
				player.effectEndDate = new Date();
			}
			else {
				player.effectEndDate = new Date(player.effectEndDate.valueOf() - t);
			}
		}
		const lastSmallEvent = PlayerSmallEvents.getLast(player.PlayerSmallEvents);
		if (lastSmallEvent) {
			lastSmallEvent.time -= t;
			await lastSmallEvent.save();
		}
		player.startTravelDate = new Date(player.startTravelDate.valueOf() - t);
	}

	/**
	 * Make a player start travelling. It does not check if the player currently travelling, if the maps are connected etc. It also saves the player
	 * @param {Players} player
	 * @param {MapLinks} newLink
	 * @param {number} time - The start time
	 * @param reason
	 * @returns {Promise<void>}
	 */
	static async startTravel(player: Player, newLink: MapLink, time: number, reason: NumberChangeReason): Promise<void> {
		player.mapLinkId = newLink.id;
		player.startTravelDate = new Date(time + minutesToMilliseconds(player.effectDuration));
		await player.save();
		if (player.effect !== Constants.EFFECT.SMILEY) {
			await Maps.applyEffect(player, player.effect, player.effectDuration, reason);
		}
	}

	/**
	 * Make a player stop travelling. It saves the player
	 * @param {Players} player
	 * @returns {Promise<void>}
	 */
	static async stopTravel(player: Player): Promise<void> {
		player.startTravelDate = new Date(0);
		await player.save();
	}

	/**
	 * Generates a string representing the player walking form a map to another
	 * @param {Players} player
	 * @param {"fr"|"en"} language
	 * @param {string|String} effect
	 * @returns {Promise<string>}
	 */
	static async generateTravelPathString(player: Player, language: string, effect: string = null): Promise<string> {
		const prevMapInstance = await player.getPreviousMap();
		const nextMapInstance = await player.getDestination();
		const time = this.getTravellingTime(player);
		let percentage = time / hoursToMilliseconds(await player.getCurrentTripDuration());

		const remainingHours = Math.floor(await player.getCurrentTripDuration() - millisecondsToHours(time));
		let remainingMinutes =
			Math.floor(hoursToMinutes(await player.getCurrentTripDuration() - millisecondsToHours(time) -
				Math.floor(await player.getCurrentTripDuration() - millisecondsToHours(time))));
		if (remainingMinutes === remainingHours && remainingHours === 0) {
			remainingMinutes++;
		}
		const timeRemainingString = "**[" + remainingHours + "h" + (remainingMinutes < 10 ? "0" : "") + remainingMinutes + "]**";
		if (percentage > 1) {
			percentage = 1;
		}
		let index = Constants.REPORT.PATH_SQUARE_COUNT * percentage;

		index = Math.floor(index);

		let str = prevMapInstance.getEmote(language) + " ";

		for (let j = 0; j < Constants.REPORT.PATH_SQUARE_COUNT; ++j) {
			if (j === index) {
				if (effect === null) {
					str += "🧍";
				}
				else {
					str += Constants.EFFECT.EMOJIS[effect as keyof typeof Constants.EFFECT.EMOJIS];
				}
			}
			else {
				str += "■";
			}
			if (j === Math.floor(Constants.REPORT.PATH_SQUARE_COUNT / 2) - 1) {
				str += timeRemainingString;
			}
		}

		return str + " " + nextMapInstance.getEmote(language);
	}

	static async isArrived(player: Player): Promise<boolean> {
		return Maps.getTravellingTime(player) >= hoursToMilliseconds(await player.getCurrentTripDuration());
	}
}