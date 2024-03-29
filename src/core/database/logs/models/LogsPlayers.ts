import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayers extends Model {
	declare readonly id: number;

	declare readonly discordId: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayers.init({
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
		tableName: "players",
		freezeTableName: true,
		timestamps: false
	});
}