import {DataTypes, Model, Sequelize} from "sequelize";

export class LogCommand extends Model {
	declare readonly id: number;

	declare readonly commandName: string;
}

export class LogCommands {
	static async getOrRegisterCommand(commandName: string): Promise<LogCommand> {
		return (await LogCommand.findOrCreate({
			where: {
				commandName
			}
		}))[0];
	}
}

export function initModel(sequelize: Sequelize): void {
	LogCommand.init({
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
		tableName: "command_logs",
		freezeTableName: true,
		timestamps: false
	});
}