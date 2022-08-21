import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsMissionsDailyFinished extends Model {
	public readonly playerId!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsMissionsDailyFinished.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "missions_daily_finished",
		freezeTableName: true,
		timestamps: false
	});

	LogsMissionsDailyFinished.removeAttribute("id");
}