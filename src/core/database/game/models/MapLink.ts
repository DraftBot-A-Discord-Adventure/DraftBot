import {DataTypes, Model, QueryTypes, Sequelize} from "sequelize";
import {RandomUtils} from "../../../utils/RandomUtils";
import MapLocation from "./MapLocation";
import moment = require("moment");

export class MapLink extends Model {
	public readonly id!: number;

	public readonly startMap!: number;

	public readonly endMap!: number;

	public readonly tripDuration!: number;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export class MapLinks {
	static async getRandomLink(): Promise<MapLink> {
		const query = "SELECT id FROM map_links;";
		const linkIds: { id: number }[] = await MapLink.sequelize.query(query, {
			type: QueryTypes.SELECT
		});
		return await MapLinks.getById(linkIds[RandomUtils.draftbotRandom.integer(0, linkIds.length - 1)].id);
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

	static async getById(id: number): Promise<MapLink> {
		return await MapLink.findOne({where: {id: id}});
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

export function setAssociations(): void {
	MapLink.hasOne(MapLocation, {
		foreignKey: "id",
		sourceKey: "startMap",
		as: "StartMap"
	});

	MapLink.hasOne(MapLocation, {
		foreignKey: "id",
		sourceKey: "endMap",
		as: "EndMap"
	});
}

export default MapLink;