import Player from "../database/game/models/Player";
import {TravelTime} from "./TravelTime";
import {MapConstants} from "../constants/MapConstants";
import {MapCache} from "./MapCache";
import {Op} from "sequelize";
import {LogsReadRequests} from "../database/logs/LogsReadRequests";
import {MapLink, MapLinkDataController} from "../../data/MapLink";
import {MapLocation, MapLocationDataController} from "../../data/MapLocation";
import {draftBotInstance} from "../../index";

export class Maps {

	/**
	 * Returns the map ids a player can go to. It excludes the map the player is coming from if at least one map is available
	 * @param {Players} player
	 * @returns {Number[]}
	 */
	static getNextPlayerAvailableMaps(player: Player): number[] {
		if (!player.mapLinkId) {
			player.mapLinkId = MapLinkDataController.instance.getRandomLink().id;
		}

		const map = player.getDestinationId();
		const previousMap = player.getPreviousMapId();

		const nextMaps = [];

		const nextMapIds = MapLocationDataController.instance.getMapsConnectedIds(map, previousMap);
		for (const id of nextMapIds) {
			nextMaps.push(id);
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
	static getConnectedMapTypes(player: Player, excludePlayerLink: boolean): string[] {
		return (
			MapLocationDataController.instance.getMapTypesConnected(player.getDestinationId(), excludePlayerLink
				? player.getPreviousMapId()
				: null)
		);
	}

	/**
	 * Make a player start travelling. It does not check if the player currently travelling, if the maps are connected etc. It also saves the player
	 * @param {Players} player
	 * @param {MapLink} newLink
	 * @param {number} time - The start time
	 * @returns {Promise<void>}
	 */
	static async startTravel(player: Player, newLink: MapLink, time: number): Promise<void> {
		player.mapLinkId = newLink.id;
		player.startTravelDate = new Date(time);
		await player.save();

		draftBotInstance.logsDatabase.logNewTravel(player.discordUserId, newLink)
			.then();
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
	 * Check if the player has arrived to the destination
	 * @param player
	 * @param date
	 */
	static isArrived(player: Player, date: Date): boolean {
		return TravelTime.getTravelDataSimplified(player, date).travelEndTime <= date.valueOf();
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
	static getMaps(): MapLocation[] {
		return MapLocationDataController.instance.getAll();
	}
}