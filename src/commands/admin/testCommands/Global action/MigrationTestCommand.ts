import {Constants} from "../../../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Database} from "../../../../core/database/Database";
import {botConfig, draftBotInstance} from "../../../../core/bot";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "migration",
	commandFormat: "<database> <number>",
	typeWaited: {
		database: Constants.TEST_VAR_TYPES.STRING,
		number: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Migration down puis up effectuée",
	description: "Effectue une migration down de la base de données puis up à nouveau",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Force a topweek end event
 * @return {String} - The successful message formatted
 */
async function migrationTestCommand(language: string, interaction: CommandInteraction, args: string[]): Promise<string> {
	if (interaction.user.id !== botConfig.BOT_OWNER_ID) {
		throw new Error("You must be the bot owner to perform this action");
	}

	const databaseName = args[0];
	const migrationNumber = parseInt(args[1], 10);

	let database: Database;
	if (databaseName === "logs") {
		database = draftBotInstance.logsDatabase;
	}
	else if (databaseName === "game") {
		database = draftBotInstance.gameDatabase;
	}
	else {
		throw new Error(`Unknown database name "${databaseName}"`);
	}

	const maxMigration = (await database.umzug.executed()).length;
	if (migrationNumber <= 0 || migrationNumber > maxMigration) {
		throw new Error(`Migration number must be between 1 and ${maxMigration}`);
	}

	await database.umzug.down({step: maxMigration - migrationNumber + 1});
	await database.umzug.up();

	return commandInfo.messageWhenExecuted;
}

commandInfo.execute = migrationTestCommand;