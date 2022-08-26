import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsGuilds extends Model {
	public readonly id!: number;

	public readonly gameId!: number;

	public readonly creationTimestamp!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuilds.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		gameId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		creationTimestamp: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds",
		freezeTableName: true,
		timestamps: false
	});
}