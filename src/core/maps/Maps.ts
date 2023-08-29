import MapLink, {MapLinks} from "../database/game/models/MapLink";
import {MapLocation, MapLocations} from "../database/game/models/MapLocation";
import Player from "../database/game/models/Player";
import {Constants} from "../Constants";
import {millisecondsToHours, millisecondsToMinutes} from "../utils/TimeUtils";
import {draftBotInstance} from "../bot";
import {NumberChangeReason} from "../constants/LogsConstants";
import {EffectsConstants} from "../constants/EffectsConstants";
import {TravelTime} from "./TravelTime";
import {MapConstants} from "../constants/MapConstants";
import {MapCache} from "./MapCache";
import {Op} from "sequelize";
import {LogsReadRequests} from "../database/logs/LogsReadRequests";

export class Maps {

	/**
	 * Returns the map ids a player can go to. It excludes the map the player is coming from if at least one map is available
	 * @param {Players} player
	 * @returns {Number[]}
	 */
	static async getNextPlayerAvailableMaps(player: Player): Promise<number[]> {
		if (!player.mapLinkId) {
			player.mapLinkId = (await MapLinks.getRandomLink()).id;
		}

		const map = await player.getDestinationId();
		const previousMap = await player.getPreviousMapId();

		const nextMaps = [];

		const nextMapIds = await MapLocations.getMapConnected(map, previousMap);
		for (const m of nextMapIds) {
			nextMaps.push(m.id);
		}

		if (nextMaps.length === 0 && previousMap) {
			nextMaps.push(previousMap);
		}
		return nextMaps;
	}

	/**
	 * Get connected map types. There can be duplicates if multiple maps have the same type
	 * @param player
	 * @param excludePlayerLink Exclude the player link from the types
	 */
	static async getConnectedMapTypes(player: Player, excludePlayerLink: boolean): Promise<string[]> {
		return (
			await MapLocations.getMapTypesConnected(await player.getDestinationId(), excludePlayerLink
				? await player.getPreviousMapId()
				: null)
		)
			.map(mapType => mapType.type);
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
		player.startTravelDate = new Date(time);
		await player.save();
		if (player.effect !== EffectsConstants.EMOJI_TEXT.SMILEY) {
			await TravelTime.applyEffect(player, player.effect, player.effectDuration, player.startTravelDate, reason);
		}
		draftBotInstance.logsDatabase.logNewTravel(player.discordUserId, newLink).then();
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
	 * @param date
	 * @param {string|String} effect
	 * @returns {Promise<string>}
	 */
	static async generateTravelPathString(player: Player, language: string, date: Date, effect: string = null): Promise<string> {
		// Gather useful data
		const prevMapInstance = await player.getPreviousMap();
		const nextMapInstance = await player.getDestination();
		const travelData = await TravelTime.getTravelDataSimplified(player, date);
		const tripDuration = travelData.travelEndTime - travelData.travelStartTime - travelData.effectDuration;
		const playerRemainingTravelTime = tripDuration - travelData.playerTravelledTime;

		let percentage = travelData.playerTravelledTime / tripDuration;

		const remainingHours = Math.floor(millisecondsToHours(playerRemainingTravelTime));
		let remainingMinutes = Math.floor(millisecondsToMinutes(playerRemainingTravelTime - remainingHours * 3600000));
		if (remainingMinutes === 60) {
			remainingMinutes = 59;
		}
		if (remainingMinutes === remainingHours && remainingHours === 0) {
			remainingMinutes++;
		}
		const timeRemainingString = `**[${remainingHours}h${remainingMinutes < 10 ? "0" : ""}${remainingMinutes}]**`;
		if (percentage > 1) {
			percentage = 1;
		}
		let index = Constants.REPORT.PATH_SQUARE_COUNT * percentage;

		index = Math.floor(index);

		let str = `${prevMapInstance.getEmote(language)} `;

		for (let j = 0; j < Constants.REPORT.PATH_SQUARE_COUNT; ++j) {
			if (j === index) {
				if (effect === null) {
					str += Maps.isOnBoat(player) ? "🚢" : "🧍";
				}
				else {
					str += EffectsConstants.EMOJIS[effect as keyof typeof EffectsConstants.EMOJIS];
				}
			}
			else {
				str += "■";
			}
			if (j === Math.floor(Constants.REPORT.PATH_SQUARE_COUNT / 2) - 1) {
				str += timeRemainingString;
			}
		}

		return `${str} ${nextMapInstance.getEmote(language)}`;
	}

	/**
	 * Check if the player has arrived to the destination
	 * @param player
	 * @param date
	 */
	static async isArrived(player: Player, date: Date): Promise<boolean> {
		return (await TravelTime.getTravelDataSimplified(player, date)).travelEndTime <= date.valueOf();
	}

	/**
	 * Check if the player is travelling
	 * @param player
	 */
	static isTravelling(player: Player): boolean {
		return player.startTravelDate.valueOf() !== 0;
	}

	/**
	 * Check if the player is on a PVE map
	 * @param player
	 */
	static isOnPveIsland(player: Player): boolean {
		return MapCache.pveIslandMapLinks.includes(player.mapLinkId);
	}

	/**
	 * Check if the player is near the water
	 * @param player
	 */
	static isNearWater(player: Player): boolean {
		return MapConstants.WATER_MAP_LINKS.includes(player.mapLinkId);
	}

	/**
	 * Check if the player is on the boat going to the PVE island
	 * @param player
	 */
	static isOnBoat(player: Player): boolean {
		return MapCache.entryAndExitBoatMapLinks.includes(player.mapLinkId);
	}

	/**
	 * Check if the player is on a continent
	 * @param player
	 */
	static isOnContinent(player: Player): boolean {
		return MapCache.continentMapLinks.includes(player.mapLinkId);
	}

	/**
	 * Get all the members of the player's guild on the pve island
	 */
	static async getGuildMembersOnPveIsland(player: Player): Promise<Player[]> {
		if (!player.guildId) {
			return Promise.resolve([]);
		}

		const membersThatWere = await LogsReadRequests.getGuildMembersThatWereOnPveIsland(player);
		const membersThatWereDiscordIds = membersThatWere.map((player) => player.discordUserId);
		// Filter discord ids that are already in the first array, because even if the players are the same the model instances are different
		const membersThatAre = (await Player.findAll({
			where: {
				guildId: player.guildId,
				mapLinkId: {
					[Op.in]: MapCache.pveIslandMapLinks
				},
				id: {
					[Op.not]: player.id
				}
			}
		})).filter((player) => !membersThatWereDiscordIds.includes(player.discordUserId));
		return [...membersThatWere, ...membersThatAre];
	}

	/**
	 * Get all the members of the player's guild on a boat
	 */
	static getGuildMembersOnBoat(player: Player): Promise<Player[]> {
		if (!player.guildId) {
			return Promise.resolve([]);
		}

		return Player.findAll({
			where: {
				guildId: player.guildId,
				mapLinkId: {
					[Op.in]: MapCache.boatEntryMapLinks
				},
				id: {
					[Op.not]: player.id
				}
			}
		});
	}

	/**
	 * Get the lost of all the mapLocations
	 */
	static getMaps() : Promise<MapLocation[]> {
		return MapLocations.getAll() ;
	}
}