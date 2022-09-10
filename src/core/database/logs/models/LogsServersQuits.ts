import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsServersQuits extends Model {
	public readonly serverId!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsServersQuits.init({
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

	LogsServersQuits.removeAttribute("id");
}