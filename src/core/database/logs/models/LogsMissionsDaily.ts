import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsMissionsDaily extends Model {
	public readonly missionId!: number;

	public readonly date!: Date;
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