import {
	Sequelize,
	Model,
	DataTypes,
	QueryTypes
} from "sequelize";
import {Constants} from "../Constants";
import Possibility from "./Possibility";
import MapLocation from "./MapLocation";
import * as fs from "fs";
import moment = require("moment");

export class BigEvent extends Model {
	public id!: number;

	public fr!: string;

	public en!: string;

	public restrictedMaps: string;

	public updatedAt!: Date;

	public createdAt!: Date;


	public getPossibilities: () => Possibility[];


	public async getReactions(): Promise<string[]> {
		const possibilities = await this.getPossibilities();
		const reactions = [];
		for (const possibility of possibilities) {
			if (reactions.indexOf(possibility.possibilityKey) === -1){
				reactions.push(possibility.possibilityKey);
			}
		}
		reactions.push(Constants.REPORT.QUICK_END_EMOTE);
		return reactions;
	}
}

export class BigEvents {
	static async pickEventOnMapType(map: MapLocation): Promise<BigEvent[]> {
		const query = `SELECT * FROM events LEFT JOIN event_map_location_ids eml ON events.id = eml.eventId WHERE events.id > 0 AND events.id < 9999 AND (
				(events.restrictedMaps IS NOT NULL AND events.restrictedMaps LIKE :mapType) OR
				(events.restrictedMaps IS NULL AND ((eml.mapLocationId IS NOT NULL AND eml.mapLocationId = :mapId) OR
				                                     (SELECT COUNT(*) FROM event_map_location_ids WHERE event_map_location_ids.mapLocationId = eml.mapLocationId) = 0))) ORDER BY RANDOM() LIMIT 1;`;
		return await MapLocation.sequelize.query(query, {
			model: BigEvent,
			replacements: {
				mapType: "%" + map.type + "%",
				mapId: map.id
			},
			type: QueryTypes.SELECT
		});
	}

	static getIdMaxEvents() {
		return new Promise((resolve, reject) => {
			fs.readdir("resources/text/events/", (err, files) =>
				err ? reject(err) : resolve(files.length - 1)
			);
		});
	}
}

export function initModel(sequelize: Sequelize) {
	BigEvent.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		fr: {
			type: DataTypes.TEXT
		},
		en: {
			type: DataTypes.TEXT
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		restrictedMaps: {
			type: DataTypes.TEXT
		}
	}, {
		sequelize,
		tableName: "events",
		freezeTableName: true
	});

	BigEvent.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default BigEvent;