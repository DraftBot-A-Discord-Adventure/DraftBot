import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsServer extends Model {
	public readonly id!: number;

	public readonly discordId!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsServer.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		discordId: {
			type: DataTypes.STRING(20), // eslint-disable-line new-cap
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "servers",
		freezeTableName: true,
		timestamps: false
	});
}