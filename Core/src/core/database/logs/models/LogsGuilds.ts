import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsGuilds extends Model {
	declare readonly id: number;

	declare readonly gameId: number;

	declare readonly creationTimestamp: number;

	declare readonly name: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuilds.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		gameId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		creationTimestamp: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds",
		freezeTableName: true,
		timestamps: false
	});
}
