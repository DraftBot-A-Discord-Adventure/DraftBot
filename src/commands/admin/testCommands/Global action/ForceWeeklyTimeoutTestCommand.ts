import {DraftBot} from "../../../../core/bot/DraftBot";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "forceweeklytimeout",
	aliases: ["forceweektimeout", "weektlyimeout", "weektimeout"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez effectué une fin de semaine !",
	description: "Effectue une fin de semaine (actions hebdomadaires)",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Force a weekly timeout
 * @return {String} - The successful message formatted
 */
const forceWeeklyTimeoutTestCommand = async (): Promise<string> => {
	await DraftBot.weeklyTimeout();

	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = forceWeeklyTimeoutTestCommand;