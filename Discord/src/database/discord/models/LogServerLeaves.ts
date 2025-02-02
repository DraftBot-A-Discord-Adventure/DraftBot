import {DataTypes, Model, Sequelize} from "sequelize";

export class LogServerLeave extends Model {
	declare readonly serverId: string;

	declare readonly serverName: string;

	declare readonly membersCount: number;
}

export class LogServerLeaves {
	static async addLog(serverId: string, serverName: string, membersCount: number): Promise<void> {
		await LogServerLeave.create({
			serverId,
			serverName,
			membersCount
		});
	}
}

export function initModel(sequelize: Sequelize): void {
	LogServerLeave.init({
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
		tableName: "server_leave_logs",
		freezeTableName: true,
		timestamps: false
	});

	LogServerLeave.removeAttribute("id");
}

export default LogServerLeave;