import {DraftBot} from "../../../../core/bot/DraftBot";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "dailytimeout",
	commandFormat: "",
	messageWhenExecuted: "Vous avez effectué un dailytimeout !",
	description: "Effectue un dailytimeout (action journalière qui actualise la potion du jour et retire des lovePoints des pets)",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Do a dailytimeout
 * @return {String} - The successful message formatted
 */
const dailyTimeoutTestCommand = (): Promise<string> => {
	DraftBot.dailyTimeout();

	return Promise.resolve(commandInfo.messageWhenExecuted);
};

commandInfo.execute = dailyTimeoutTestCommand;