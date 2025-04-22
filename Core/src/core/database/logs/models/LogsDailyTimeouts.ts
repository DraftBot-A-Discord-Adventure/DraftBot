import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsDailyTimeouts extends Model {
	declare readonly petLoveChange: boolean;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsDailyTimeouts.init({
		petLoveChange: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "daily_timeouts",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
