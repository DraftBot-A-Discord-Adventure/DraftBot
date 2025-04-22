import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsMissionsFailed extends Model {
	declare readonly playerId: number;

	declare readonly missionId: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsMissionsFailed.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
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
		tableName: "missions_failed",
		freezeTableName: true,
		timestamps: false
	});

	LogsMissionsFailed.removeAttribute("id");
}
