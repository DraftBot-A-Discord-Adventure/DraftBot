import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsMissionsFound extends Model {
	declare readonly playerId: number;

	declare readonly missionId: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsMissionsFound.init({
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
		tableName: "missions_found",
		freezeTableName: true,
		timestamps: false
	});

	LogsMissionsFound.removeAttribute("id");
}