class Maps {

	/**
	 * Returns the map ids a player can go to. It excludes the map the player is coming from if at least one map is available
	 * @param {Players} player
	 * @param {string|String} restrictedMapType
	 * @returns {Number[]}
	 */
	static async getNextPlayerAvailableMaps(player, restrictedMapType) {
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
	static isTravelling(player) {
		return player.startTravelDate.getTime() !== 0;
	}

	/**
	 * Get the time in ms the player is travelling
	 * @param {Players} player
	 * @returns {number}
	 */
	static getTravellingTime(player) {
		if (!this.isTravelling(player)) {
			return 0;
		}
		const malus = player.currentEffectFinished() ? 0 : Date.now() - player.effectEndDate.getTime();
		return Date.now() - player.startTravelDate - malus;
	}


	static async applyEffect(player, effect, time = 0) {
		await this.removeEffect(player);
		player.effect = effect;
		if (effect === EFFECT.OCCUPIED) {
			player.effectDuration = time;
		}
		else {
			player.effectDuration = millisecondsToMinutes(JsonReader.models.players.effectMalus[effect]);
		}
		player.effectEndDate = new Date(Date.now() + minutesToMilliseconds(player.effectDuration));
		player.startTravelDate = new Date(player.startTravelDate.getTime() + minutesToMilliseconds(player.effectDuration));
		await player.save();
	}

	static async removeEffect(player) {
		const remainingTime = player.effectRemainingTime();
		player.effect = EFFECT.SMILEY;
		player.effectDuration = 0;
		player.effectEndDate = new Date();
		if (remainingTime > 0) {
			this.advanceTime(player, millisecondsToMinutes(remainingTime));
		}
		await player.save();
	}

	static advanceTime(player, time) {
		const t = minutesToMilliseconds(time);
		if (player.effectRemainingTime() !== 0) {
			if (t >= player.effectEndDate.getTime() - Date.now()) {
				player.effectEndDate = Date.now();
			}
			else {
				player.effectEndDate = new Date(player.effectEndDate.getTime() - t);
			}
		}
		player.startTravelDate = new Date(player.startTravelDate.getTime() - t);
	}

	/**
	 * Make a player start travelling. It does not check if the player currently travelling, if the maps are connected etc. It also saves the player
	 * @param {Players} player
	 * @param {MapLinks} newLink
	 * @param {number} time - The start time
	 * @returns {Promise<void>}
	 */
	static async startTravel(player, newLink, time) {
		player.mapLinkId = newLink.id;
		player.startTravelDate = new Date(time + minutesToMilliseconds(player.effectDuration));
		await player.save();
		if (player.effect !== EFFECT.SMILEY) {
			await Maps.applyEffect(player, player.effect, player.effectDuration);
		}
	}

	/**
	 * Make a player stop travelling. It saves the player
	 * @param {Players} player
	 * @returns {Promise<void>}
	 */
	static async stopTravel(player) {
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
	static async generateTravelPathString(player, language, effect = null) {
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

		const timeRemainingString = "**[" + remainingHours + "h" + remainingMinutes + "]**";
		if (percentage > 1) {
			percentage = 1;
		}
		let index = REPORT.PATH_SQUARE_COUNT * percentage;

		index = Math.floor(index);

		let str = prevMapInstance.getEmote(language) + " ";

		for (let j = 0; j < REPORT.PATH_SQUARE_COUNT; ++j) {
			if (j === index) {
				if (effect === null) {
					str += "🧍";
				}
				else {
					str += EFFECT.EMOJIS[effect];
				}
			}
			else {
				str += "■";
			}
			if (j === Math.floor(REPORT.PATH_SQUARE_COUNT / 2) - 1) {
				str += timeRemainingString;
			}
		}

		return str + " " + nextMapInstance.getEmote(language);
	}
}

module.exports = Maps;