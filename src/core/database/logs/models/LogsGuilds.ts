import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsGuilds extends Model {
	public readonly id!: number;

	public readonly gameId!: number;

	public name!: string;

	public chiefId!: number;

	public isDeleted!: boolean;
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
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		chiefId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		isDeleted: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds",
		freezeTableName: true,
		timestamps: false
	});
}