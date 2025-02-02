import {DataTypes, Model, Sequelize} from "sequelize";

export class LogServer extends Model {
	declare readonly id: number;

	declare readonly discordId: string;
}

export class LogServers {
	static async getOrRegisterServer(discordId: string): Promise<LogServer> {
		return (await LogServer.findOrCreate({
			where: {
				discordId
			}
		}))[0];
	}
}

export function initModel(sequelize: Sequelize): void {
	LogServer.init({
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
		tableName: "servers_logs",
		freezeTableName: true,
		timestamps: false
	});
}