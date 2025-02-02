import {DataTypes, Model, Sequelize} from "sequelize";

export class LogPlayer extends Model {
	declare readonly id: number;

	declare readonly discordId: string;
}

export class LogPlayers {
	static async getOrRegisterPlayer(discordId: string): Promise<LogPlayer> {
		return (await LogPlayer.findOrCreate({
			where: {
				discordId
			}
		}))[0];
	}
}

export function initModel(sequelize: Sequelize): void {
	LogPlayer.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		discordId: {
			type: DataTypes.STRING(64), // eslint-disable-line new-cap
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_logs",
		freezeTableName: true,
		timestamps: false
	});
}