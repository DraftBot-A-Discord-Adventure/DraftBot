import {DataTypes, Model, Sequelize} from "sequelize";

export class LogServerJoin extends Model {
	declare readonly serverId: string;

	declare readonly serverName: string;

	declare readonly membersCount: number;
}

export class LogServerJoins {
	static async addLog(serverId: string, serverName: string, membersCount: number): Promise<void> {
		await LogServerJoin.create({
			serverId,
			serverName,
			membersCount
		});
	}
}

export function initModel(sequelize: Sequelize): void {
	LogServerJoin.init({
		serverId: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		serverName: {
			type: DataTypes.TEXT
		},
		membersCount: {
			type: DataTypes.INTEGER
		}
	}, {
		sequelize,
		tableName: "server_join_logs",
		freezeTableName: true,
		timestamps: false
	});

	LogServerJoin.removeAttribute("id");
}

export default LogServerJoin;