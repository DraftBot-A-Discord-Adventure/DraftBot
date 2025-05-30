import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsCommands extends Model {
	declare readonly id: number;

	declare readonly commandName: string;
}

export function initModel(sequelize: Sequelize): void {
	LogsCommands.init({
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
