import {DataTypes, Model, Sequelize} from "sequelize";
import {Constants} from "../../../Constants";
import BigEvent from "./BigEvent";
import * as moment from "moment";

export class Possibility extends Model {
	public id!: number;

	public possibilityKey!: string;

	public lostTime!: number;

	public health!: number;

	public oneshot!: boolean;

	public effect!: string;

	public experience!: number;

	public money!: number;

	public item!: boolean;

	public fr!: string;

	public en!: string;

	public eventId!: number;

	public nextEvent!: number;

	public restrictedMaps!: string;

	public updatedAt!: Date;

	public createdAt!: Date;


	public getText(language: string): string {
		return language === Constants.LANGUAGE.FRENCH ? this.fr : this.en;
	}
}

export function initModel(sequelize: Sequelize): void {
	Possibility.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		possibilityKey: {
			type: DataTypes.STRING(32) // eslint-disable-line new-cap
		},
		lostTime: {
			type: DataTypes.BIGINT
		},
		health: {
			type: DataTypes.INTEGER
		},
		oneshot: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		effect: {
			type: DataTypes.STRING(32) // eslint-disable-line new-cap
		},
		experience: {
			type: DataTypes.INTEGER
		},
		money: {
			type: DataTypes.INTEGER
		},
		item: {
			type: DataTypes.BOOLEAN
		},
		fr: {
			type: DataTypes.TEXT
		},
		en: {
			type: DataTypes.TEXT
		},
		eventId: {
			type: DataTypes.INTEGER
		},
		nextEvent: {
			type: DataTypes.INTEGER
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		restrictedMaps: {
			type: DataTypes.TEXT
		}
	}, {
		sequelize,
		tableName: "possibilities",
		freezeTableName: true
	});

	Possibility.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export function setAssociations(): void {
	Possibility.belongsTo(BigEvent, {
		foreignKey: "eventId",
		as: "Event"
	});
}

export default Possibility;