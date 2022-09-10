import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsMissionsFailed extends Model {
	public readonly playerId!: number;

	public readonly missionId!: number;

	public readonly date!: number;
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