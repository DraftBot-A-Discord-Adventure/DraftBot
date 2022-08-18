import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsServerQuit extends Model {
	public readonly serverId!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsServerQuit.init({
		serverId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "servers_quits",
		freezeTableName: true,
		timestamps: false
	});

	LogsServerQuit.removeAttribute("id");
}