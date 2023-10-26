import {DataTypes, Model, Op, QueryTypes, Sequelize} from "sequelize";
import {RandomUtils} from "../../../utils/RandomUtils";
import {MapConstants} from "../../../constants/MapConstants";
import moment = require("moment");

export class MapLink extends Model {
	declare readonly id: number;

	declare readonly startMap: number;

	declare readonly endMap: number;

	declare readonly tripDuration: number;

	declare readonly forcedImage?: string;

	declare updatedAt: Date;

	declare createdAt: Date;
}

export class MapLinks {
	static async getRandomLink(): Promise<MapLink> {
		const query = `SELECT ml.id FROM map_links ml
			JOIN map_locations ml_start ON ml.startMap = ml_start.id
			JOIN map_locations ml_end ON ml.endMap = ml_end.id
			WHERE ml_start.attribute = :continentConst
			AND ml_end.attribute = :continentConst;`;
		const linkIds: { id: number }[] = await MapLink.sequelize.query(query, {
			type: QueryTypes.SELECT,
			replacements: {
				continentConst: MapConstants.MAP_ATTRIBUTES.CONTINENT1
			}
		});
		return await MapLinks.getById(linkIds[RandomUtils.randInt(0, linkIds.length)].id);
	}

	static async getLinkByLocations(idStartPoint: number, idEndPoint: number): Promise<MapLink> {
		return await MapLink.findOne({
			where: {
				startMap: idStartPoint,
				endMap: idEndPoint
			}
		});
	}

	static async getLinksByMapStart(idStartPoint: number): Promise<MapLink[]> {
		return await MapLink.findAll({
			where: {
				startMap: idStartPoint
			}
		});
	}

	static async getInverseLinkOf(idMapLink: number): Promise<MapLink> {
		const mapLinkToInvert = await MapLinks.getById(idMapLink);
		return await MapLink.findOne({
			where: {
				startMap: mapLinkToInvert.endMap,
				endMap: mapLinkToInvert.startMap
			}
		});
	}

	/**
	 * Get the list of all the mapLinks excluding the one given in parameter and if it exist the one that is the opposite of the one given in parameter (inverted destination and origin)
	 * @param excludedMapLink : MapLink to exclude (can be null)
	 */
	static getMapLinks(excludedMapLink : MapLink | null = null) : Promise<MapLink[]> {
		if (!excludedMapLink) {
			return MapLink.findAll();
		}
		return MapLink.findAll({
			where: {
				[Op.not]: [
					{
						[Op.or]: [
							{
								startMap: excludedMapLink.startMap,
								endMap: excludedMapLink.endMap
							},
							{
								startMap: excludedMapLink.endMap,
								endMap: excludedMapLink.startMap
							}
						]
					}
				]
			}
		});
	}

	static async getById(id: number): Promise<MapLink> {
		return await MapLink.findOne({where: {id}});
	}

	static async getMapLinksWithMapTypes(mapTypes: string[], startMapId: number, blacklistMapId: number): Promise<MapLink[]> {
		const query = `SELECT map_links.* FROM map_links
			JOIN map_locations ml_start ON map_links.startMap = ml_start.id
			JOIN map_locations ml_end ON map_links.endMap = ml_end.id
			WHERE ml_start.id = :startMapId
				AND ml_end.id != :blacklistMapId
			    AND ml_end.type IN (:mapTypes)`;
		return await MapLink.sequelize.query(query, {
			type: QueryTypes.SELECT,
			replacements: {
				startMapId,
				blacklistMapId: blacklistMapId ?? -1,
				mapTypes
			}
		});
	}

	static async getFromAttributeToAttribute(attributeFrom: string, attributeTo: string): Promise<MapLink[]> {
		const query = `SELECT map_links.* FROM map_links
			JOIN map_locations ml_start ON map_links.startMap = ml_start.id
			JOIN map_locations ml_end ON map_links.endMap = ml_end.id
			WHERE ml_start.attribute = :attributeFrom
				AND ml_end.attribute = :attributeTo`;
		return await MapLink.sequelize.query(query, {
			type: QueryTypes.SELECT,
			replacements: {
				attributeFrom,
				attributeTo
			}
		});
	}
}

export function initModel(sequelize: Sequelize): void {
	MapLink.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		startMap: {
			type: DataTypes.INTEGER
		},
		endMap: {
			type: DataTypes.INTEGER
		},
		tripDuration: {
			type: DataTypes.INTEGER
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
		tableName: "map_links",
		freezeTableName: true
	});

	MapLink.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default MapLink;