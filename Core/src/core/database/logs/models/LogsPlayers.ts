import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPlayers extends Model {
	declare readonly id: number;

	declare readonly keycloakId: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayers.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		keycloakId: {
			type: DataTypes.STRING(64), // eslint-disable-line new-cap
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players",
		freezeTableName: true,
		timestamps: false
	});
}
