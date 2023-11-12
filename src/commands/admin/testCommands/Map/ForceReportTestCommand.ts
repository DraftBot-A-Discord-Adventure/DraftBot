import {CommandsManager} from "../../../CommandsManager";
import {format} from "../../../../core/utils/StringFormatter";
import {Constants} from "../../../../core/Constants";
import {CommandsTest, ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {DraftbotInteraction} from "../../../../core/messages/DraftbotInteraction";

export const commandInfo: ITestCommand = {
	name: "forcereport",
	aliases: ["fr", "forcer"],
	commandFormat: "<id>",
	typeWaited: {
		id: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Event {id} forcé !",
	description: "Force un rapport donné",
	commandTestShouldReply: false,
	execute: null // Defined later
};

/**
 * Force a report with a given event id
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const forceReportTestCommand = async (language: string, interaction: DraftbotInteraction, args: string[]): Promise<string> => {
	const player = (await Players.getOrRegister(interaction.user.id))[0];
	await CommandsTest.getTestCommand("atravel").execute(language, interaction, ["5000"]);
	await CommandsManager.executeCommandWithParameters("report", interaction, language, player, parseInt(args[0], 10));
	return format(commandInfo.messageWhenExecuted, {id: args[0] === "-1" ? "aléatoire" : args[0]});
};

commandInfo.execute = forceReportTestCommand;