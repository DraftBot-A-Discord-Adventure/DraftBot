import {DataTypes, Model, Sequelize} from "sequelize";
import {Data} from "../Data";
import moment = require("moment");

export class Server extends Model {
	public id!: number;

	public language!: string;

	public discordGuildId!: string;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export class Servers {
	static async getOrRegister(discordGuildId: string) {
		return await Server.findOrCreate({
			where: {
				discordGuildId: discordGuildId
			}
		});
	}
}

export function initModel(sequelize: Sequelize): void {
	const data = Data.getModule("models.servers");

	Server.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		language: {
			type: DataTypes.STRING(2), // eslint-disable-line new-cap
			defaultValue: data.getString("language")
		},
		discordGuildId: {
			type: DataTypes.STRING(64) // eslint-disable-line new-cap
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
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