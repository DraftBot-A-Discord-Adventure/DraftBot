import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import moment = require("moment");

export class MissionTag extends Model {
	public readonly id!: number;

	public textTag!: string;

	public idObject!: number;

	public typeObject!: string;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export function initModel(sequelize: Sequelize) {
	MissionTag.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		textTag: {
			type: DataTypes.STRING
		},
		idObject: {
			type: DataTypes.INTEGER
		},
		typeObject: {
			type: DataTypes.STRING
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "mission_tags",
		freezeTableName: true
	});

	MissionTag.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default MissionTag;