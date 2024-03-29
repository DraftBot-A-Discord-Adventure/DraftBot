import {DataTypes, Model, Op, QueryTypes, Sequelize} from "sequelize";
import {Translations} from "../../../Translations";
import {Tags} from "./Tag";
import {draftBotInstance} from "../../../bot";
import * as moment from "moment";
import {Constants} from "../../../Constants";

export class MapLocation extends Model {
	declare readonly id: number;

	declare readonly type: string;

	declare readonly nameFr: string;

	declare readonly nameEn: string;

	declare readonly descFr: string;

	declare readonly descEn: string;

	declare readonly particleFr: string;

	declare readonly particleEn: string;

	declare readonly canBeGoToPlaceMissionDestination: boolean;

	declare readonly attribute: string;

	declare readonly forcedImage?: string;

	declare updatedAt: Date;

	declare createdAt: Date;

	/**
	 * Get the emote for the map
	 * @param language
	 */
	public getEmote(language: string): string {
		return Translations.getModule("models.maps", language).get(`types.${this.type}.emote`);
	}

	/**
	 * Get the name of the map without the emote
	 * @param language
	 */
	public getNameWithoutEmote(language: string): string {
		return language === Constants.LANGUAGE.FRENCH ? this.nameFr : this.nameEn;
	}

	/**
	 * Get the display name of the map with the emote
	 * @param language
	 */
	public getDisplayName(language: string): string {
		return `${this.getEmote(language)} ${language === Constants.LANGUAGE.FRENCH ? this.nameFr : this.nameEn}`;
	}

	/**
	 * Get the particle to use with this map Location
	 * @param language
	 */
	public getParticleName(language: string): string {
		return language === Constants.LANGUAGE.FRENCH ? this.particleFr : this.particleEn;
	}

	/**
	 * Get the description of the map
	 * @param language
	 */
	public getDescription(language: string): string {
		return language === Constants.LANGUAGE.FRENCH ? this.descFr : this.descEn;
	}

	/**
	 * Get the map location with the added determinant if needed
	 * @param language
	 */
	public async getFullName(language: string): Promise<string> {
		return `${await this.getDeterminant(language)} ${this.getDisplayName(language)}`;
	}

	/**
	 * Get the determinant for the map name to use in french
	 * @param language
	 */
	public async getDeterminant(language: string): Promise<string> {
		if (language !== Constants.LANGUAGE.FRENCH) {
			return "";
		}
		const tags = await Tags.findTagsFromObject(this.id, "MapLocation");
		for (const tag of tags) {
			if (tag.textTag === "detA") {
				return "à";
			}
			if (tag.textTag === "detAu") {
				return "au";
			}
			if (tag.textTag === "detALa") {
				return "à la";
			}
		}
		return "";
	}

	/**
	 * Count all players that have the given map as their current map of origin
	 * @param originId
	 */
	public async playersCount(originId: number): Promise<number> {
		const query = `SELECT COUNT(*) as count
					   FROM players
					   WHERE mapLinkId IN (
						   SELECT id
						   FROM map_links
						   WHERE startMap = :id
						 AND endMap = :prevId
						  OR endMap = :id
						 AND startMap = :prevId
						   );`;
		return (<{ count: number }[]>(await MapLocation.sequelize.query(query, {
			replacements: {
				id: this.id,
				prevId: originId
			},
			type: QueryTypes.SELECT
		})))[0].count;
	}
}

export class MapLocations {

	/**
	 * Get a mapLocation by its id
	 * @param id
	 */
	static async getById(id: number): Promise<MapLocation> {
		return await MapLocation.findOne({where: {id}});
	}

	/**
	 * Get all mapLocations
	 */
	static async getAll(): Promise<MapLocation[]> {
		return await MapLocation.findAll();
	}

	/**
	 * Get all mapLocations where the player can go in a random order.
	 */
	static async getRandomGotoableMap(): Promise<MapLocation> {
		return await MapLocation.findOne({
			order: [draftBotInstance.gameDatabase.sequelize.random()],
			where: {canBeGoToPlaceMissionDestination: true}
		});
	}

	/**
	 * Get the list of mapLocations that are connected to the mapLocation with the given id
	 * @param mapId
	 * @param blacklistId
	 */
	static async getMapConnected(mapId: number, blacklistId: number): Promise<{ id: number }[]> {
		if (!blacklistId) {
			blacklistId = -1;
		}

		const query = `SELECT id
					   FROM map_locations
                       WHERE id != :blacklistId
                         AND (
                           id IN (SELECT endMap FROM map_links WHERE startMap = :mapId));`;
		return await MapLocation.sequelize.query(query, {
			type: QueryTypes.SELECT,
			replacements: {
				mapId,
				blacklistId
			}
		});
	}

	/**
	 * Get all mapLocation types adjacent to the given mapLocation id
	 * @param mapId
	 * @param blacklistId
	 */
	static async getMapTypesConnected(mapId: number, blacklistId: number): Promise<{ type: string }[]> {
		const query = `SELECT type
					   FROM map_locations
                       WHERE id != :blacklistId
                         AND (
                           id IN (SELECT endMap FROM map_links WHERE startMap = :mapId));`;
		return await MapLocation.sequelize.query(query, {
			type: QueryTypes.SELECT,
			replacements: {
				mapId,
				blacklistId: blacklistId ?? -1
			}
		});
	}

	/**
	 * Get the list of players who are on the indicated path
	 * @param mapId
	 * @param previousMapId
	 * @param playerId
	 */
	static async getPlayersOnMap(mapId: number, previousMapId: number, playerId: number): Promise<{ discordUserId: string }[]> {
		const query = `SELECT discordUserId
					   FROM players 
					   WHERE players.id != :playerId
						 AND players.mapLinkId IN (
						   SELECT id from map_links
						   WHERE (startMap = :pMapId
						 AND endMap = :mapId)
						  OR (startMap = :mapId
						 AND endMap = :pMapId)
						   )
					   ORDER BY RAND();`;
		return await MapLocation.sequelize.query(query, {
			replacements: {
				mapId,
				pMapId: previousMapId,
				playerId
			},
			type: QueryTypes.SELECT
		});
	}

	/**
	 * Get the list of mapLocations that match one or more attribute(s).
	 * @param attributes
	 */
	static async getWithAttributes(attributes: string[]): Promise<MapLocation[]> {
		return await MapLocation.findAll({
			where: {
				attribute: {
					[Op.in]: attributes
				}
			}
		});
	}
}

export function initModel(sequelize: Sequelize): void {
	MapLocation.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		type: {
			type: DataTypes.TEXT
		},
		nameFr: {
			type: DataTypes.TEXT
		},
		nameEn: {
			type: DataTypes.TEXT
		},
		descFr: {
			type: DataTypes.TEXT
		},
		descEn: {
			type: DataTypes.TEXT
		},
		particleFr: {
			type: DataTypes.TEXT
		},
		particleEn: {
			type: DataTypes.TEXT
		},
		canBeGoToPlaceMissionDestination: {
			type: DataTypes.BOOLEAN
		},
		attribute: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		forcedImage: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "map_locations",
		freezeTableName: true
	});

	MapLocation.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default MapLocation;