class Maps {

	static Directions = {
		NORTH: "north",
		SOUTH: "south",
		EAST: "east",
		WEST: "west"
	};

	/**
	 * Returns the map ids a player can go to. It excludes the map the player is coming from if at least one map is available
	 * @param {Players} player
	 * @param {string|String} restricted_map_type
	 * @returns {Number[]}
	 */
	static async getNextPlayerAvailableMaps(player, restricted_map_type) {
		let map;
		if (!player.map_id) {
			map = await MapLocations.getRandomMap();
			player.previous_map_id = map.id;
			player.map_id = map.id;
		}
		else {
			map = await MapLocations.getById(player.map_id);
		}
		let next_maps = [];
		if (restricted_map_type) {
			const next_map_ids = await MapLocations.getMapConnectedWithTypeFilter(map.id, restricted_map_type);
			for (const m of next_map_ids) {
				next_maps.push(m.id);
			}
			return next_maps;
		}
		for (const map_dir of ["north_map", "south_map", "east_map", "west_map"]) {
			if (map[map_dir] && map[map_dir] !== player.previous_map_id) {
				next_maps.push(map[map_dir]);
			}
		}
		if (next_maps.length === 0 && player.previous_map_id) {
			next_maps.push(player.previous_map_id);
		}
		return next_maps;
	}

	/**
	 * Returns the direction of a map to another. The result is null if the maps are not connected
	 * @param {MapLocations} from_map
	 * @param {Number} to_map_id
	 * @returns {Directions|null}
	 */
	static getMapDirection(from_map, to_map_id) {
		if (!from_map) {
			return null;
		}
		if (from_map.north_map === to_map_id) {
			return this.Directions.NORTH;
		}
		if (from_map.south_map === to_map_id) {
			return this.Directions.SOUTH;
		}
		if (from_map.east_map === to_map_id) {
			return this.Directions.EAST;
		}
		if (from_map.west_map === to_map_id) {
			return this.Directions.WEST;
		}
		return null;
	}

	/**
	 * Get the placeholder of the events. It is designed to be used in the format function
	 * @param {Players} player
	 * @param {"fr"|"en"} language
	 * @returns {{}}
	 */
	static async getEventPlaceHolders(player, language) {
		const previous_map = await MapLocations.getById(player.previous_map_id);
		const direction = this.getMapDirection(previous_map, player.map_id);
		return {
			direction: !direction ? "null" : JsonReader.models.maps.getTranslation(language).directions.names[direction],
			direction_prefix: !direction ? "null" : JsonReader.models.maps.getTranslation(language).directions.prefix[direction],
		};
	}

	/**
	 * Get if the player is currently travelling between 2 maps
	 * @param {Players} player
	 * @returns {boolean}
	 */
	static isTravelling(player) {
		return player.start_travel_date.getUTCMilliseconds() !== 0;
	}

	/**
	 * Get the time in ms the player is travelling
	 * @param {Players} player
	 * @returns {number}
	 */
	static getTravellingTime(player) {
		if (!this.isTravelling(player)) return 0;
		const malus = player.currentEffectFinished() ? 0 : Date.now() - player.effect_end_date.getTime();
		return Date.now() - player.start_travel_date - malus;
	}


	static async applyEffect(player, effect, time = 0) {
		await this.removeEffect(player);
		player.effect = effect;
		if (effect === EFFECT.OCCUPIED) {
			player.effect_duration = time;
		} else {
			player.effect_duration = millisecondsToMinutes(JsonReader.models.players.effectMalus[effect]);
		}
		player.effect_end_date = new Date(Date.now() + minutesToMilliseconds(player.effect_duration));
		player.start_travel_date = new Date(player.start_travel_date.getTime() + minutesToMilliseconds(player.effect_duration));
		await player.save();
	}

	static async removeEffect(player) {
		const remainingTime = player.effectRemainingTime();
		player.effect = EFFECT.SMILEY;
		player.effect_duration = 0;
		player.effect_end_date = new Date();
		if (remainingTime > 0) {
			this.advanceTime(player, millisecondsToMinutes(remainingTime));
		}
		await player.save();
	}

	static advanceTime(player, time) {
		let t = minutesToMilliseconds(time);
		if (player.effectRemainingTime() !== 0) {
			if (t>=player.effect_end_date.getTime()-Date.now()) {
				player.effect_end_date = Date.now();
			} else {
				player.effect_end_date = new Date(player.effect_end_date.getTime() - t);
			}
		}
		player.start_travel_date = new Date(player.start_travel_date.getTime() - t);
	}

	/**
	 * Make a player start travelling. It does not check if the player currently travelling, if the maps are connected etc. It also saves the player
	 * @param {Players} player
	 * @param {number} map_id
	 * @param {number} time - The start time
	 * @returns {Promise<void>}
	 */
	static async startTravel(player, map_id,time) {
		player.previous_map_id = player.map_id;
		player.map_id = map_id;
		player.start_travel_date = new Date(time + minutesToMilliseconds(player.effect_duration));
		await player.save();
		if (player.effect !== EFFECT.SMILEY) {
			await Maps.applyEffect(player, player.effect, player.effect_duration);
		}
	}

	/**
	 * Make a player stop travelling. It saves the player
	 * @param {Players} player
	 * @returns {Promise<void>}
	 */
	static async stopTravel(player) {
		player.start_travel_date = new Date(0);
		await player.save();
	}

	/**
	 * The number of squares between small events in the travel path string
	 * @type {number}
	 */
	static PATH_SQUARE_COUNT = 4;

	/**
	 * Generates a string representing the player walking form a map to another
	 * @param {Players} player
	 * @param {"fr"|"en"} language
	 * @returns {Promise<string>}
	 */
	static async generateTravelPathString(player, language) {
		const prevMapInstance = await MapLocations.getById(player.previous_map_id);
		const nextMapInstance = await MapLocations.getById(player.map_id);
		let percentage = this.getTravellingTime(player) / (2*60*60*1000);
		if (percentage > 1) {
			percentage = 1;
		}
		let index = 0;
		const percentageSpan = 1 / (REPORT.SMALL_EVENTS_COUNT + 1);
		for (let i = 0; i < REPORT.SMALL_EVENTS_COUNT + 1; ++i) {
			if (percentage <= (i + 1) * percentageSpan) {
				index = i * (this.PATH_SQUARE_COUNT + 1) + this.PATH_SQUARE_COUNT * (percentage - i * percentageSpan) / percentageSpan;
				break;
			}
		}
		index = Math.floor(index);
		let str = prevMapInstance.getEmote(language) + " ";
		for (let i = 0; i < REPORT.SMALL_EVENTS_COUNT + 1; ++i) {
			for (let j = 0; j < this.PATH_SQUARE_COUNT; ++j) {
				if (i * (this.PATH_SQUARE_COUNT + 1) + j === index) {
					str += "🧍";
				}
				else {
					str += "■";
				}
			}
			if (i < REPORT.SMALL_EVENTS_COUNT) {
				let added = false;
				for (let j = 0; j < player.PlayerSmallEvents.length; ++j) {
					if (player.PlayerSmallEvents[j].number === i + 1) {
						str += " " + JsonReader.small_events[player.PlayerSmallEvents[j].event_type].emote + " ";
						added = true;
						break;
					}
				}
				if (!added) {
					str += " ❓ ";
				}
			}
		}
		return str + " " + nextMapInstance.getEmote(language);
	}
}

module.exports = Maps;