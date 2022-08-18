import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsMissionsFound extends Model {
	public readonly playerId!: number;

	public readonly missionId!: number;

	public readonly date!: Date;
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