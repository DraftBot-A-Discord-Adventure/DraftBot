import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayer extends Model {
	public readonly id!: number;

	public readonly discordId!: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayer.init({
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
		tableName: "players",
		freezeTableName: true,
		timestamps: false
	});
}