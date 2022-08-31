import {DataTypes, Model, Sequelize} from "sequelize";
import {ServersConstants} from "../../../constants/ServersConstants";
import moment = require("moment");

export class Server extends Model {
	public id!: number;

	public language!: string;

	public discordGuildId!: string;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export class Servers {
	static async getOrRegister(discordGuildId: string): Promise<Server> {
		return (await Server.findOrCreate({
			where: {
				discordGuildId: discordGuildId
			}
		}))[0];
	}
}

export function initModel(sequelize: Sequelize): void {
	Server.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		language: {
			type: DataTypes.STRING(2), // eslint-disable-line new-cap
			defaultValue: ServersConstants.DEFAULT_LANGUAGE
		},
		discordGuildId: {
			type: DataTypes.STRING(64) // eslint-disable-line new-cap
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "servers",
		freezeTableName: true
	});

	Server.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Server;