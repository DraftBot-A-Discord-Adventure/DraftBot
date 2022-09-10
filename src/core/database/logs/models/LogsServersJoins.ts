import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsServersJoins extends Model {
	public readonly serverId!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsServersJoins.init({
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
		tableName: "servers_joins",
		freezeTableName: true,
		timestamps: false
	});

	LogsServersJoins.removeAttribute("id");
}