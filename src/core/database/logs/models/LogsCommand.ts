import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsCommand extends Model {
	public readonly id!: number;

	public readonly commandName!: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsCommand.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		commandName: {
			type: DataTypes.STRING,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "commands",
		freezeTableName: true,
		timestamps: false
	});
}