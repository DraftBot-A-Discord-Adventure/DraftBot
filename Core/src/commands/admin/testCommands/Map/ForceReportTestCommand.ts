import {CommandsTest, ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "forcereport",
	aliases: ["fr", "forcer"],
	commandFormat: "<id>",
	typeWaited: {
		id: TypeKey.INTEGER
	},
	description: "Force un rapport donné"
};

/**
 * Force a report with a given event id
 */
const forceReportTestCommand: ExecuteTestCommandLike = async (player, args, response, context) => {
	await CommandsTest.getTestCommand("atravel").execute(player, ["5000"], response, context);
	// TODO : replace with the new way of executing commands
	// Await CommandsManager.executeCommandWithParameters("report", interaction, language, player, parseInt(args[0], 10));
	return `Event ${args[0] === "-1" ? "aléatoire" : args[0]} forcé !`;
};

commandInfo.execute = forceReportTestCommand;