import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import moment = require("moment");

export class Mission extends Model {
	public readonly id!: string;

	public readonly descFr!: string;

	public readonly descEn!: string;

	public readonly campaignOnly!: boolean;

	public readonly gems!: number;

	public readonly xp!: number;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export function initModel(sequelize: Sequelize) {
	Mission.init({
		id: {
			type: DataTypes.TEXT,
			primaryKey: true
		},
		descFr: {
			type: DataTypes.TEXT
		},
		descEn: {
			type: DataTypes.TEXT
		},
		campaignOnly: {
			type: DataTypes.BOOLEAN
		},
		gems: {
			type: DataTypes.INTEGER
		},
		xp: {
			type: DataTypes.INTEGER
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
		tableName: "missions",
		freezeTableName: true
	});

	Mission.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Mission;