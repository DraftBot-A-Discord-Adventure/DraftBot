import {DataTypes, Model, Sequelize} from "sequelize";
import moment = require("moment");

/**
 * RegisteredCommands model
 */
export class RegisteredCommand extends Model {
	public commandName!: string;

	public jsonHash!: string;

	public guildCommand!: boolean;

	public updatedAt!: Date;

	public createdAt!: Date;
}

/**
 * RegisteredCommands model initialization
 */
export class RegisteredCommands {

	/**
	 * get a command by its name from the database
	 * @param commandName
	 */
	static async getCommand(commandName: string): Promise<RegisteredCommand | null> {
		return (await RegisteredCommand.findOrCreate({
			where: {
				commandName
			},
			defaults: {
				jsonHash: "",
				guildCommand: false
			}
		}))[0];
	}

	/**
	 * get all the commands from the database
	 */
	static async getAll(): Promise<RegisteredCommand[]> {
		return await RegisteredCommand.findAll();
	}

	/**
	 * delete a command from the database
	 * @param commandName
	 */
	static async deleteCommand(commandName: string): Promise<void> {
		await RegisteredCommand.destroy({ where: { commandName }});
	}
}

/**
 * RegisteredCommands model initialization
 * @param sequelize
 */
export function initModel(sequelize: Sequelize): void {
	RegisteredCommand.init({
		commandName: {
			type: DataTypes.STRING(40), // eslint-disable-line new-cap
			primaryKey: true
		},
		jsonHash: {
			// SHA-1 -> 20 bytes = 40 hex characters
			type: DataTypes.STRING(40) // eslint-disable-line new-cap
		},
		guildCommand: DataTypes.BOOLEAN,
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "registered_commands",
		freezeTableName: true
	});

	RegisteredCommand.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default RegisteredCommand;