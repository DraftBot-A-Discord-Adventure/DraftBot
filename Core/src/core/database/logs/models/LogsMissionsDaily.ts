import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsMissionsDaily extends Model {
	declare readonly missionId: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsMissionsDaily.init({
		missionId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "missions_daily",
		freezeTableName: true,
		timestamps: false
	});

	LogsMissionsDaily.removeAttribute("id");
}
