import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";
import { DraftBot } from "../../../../core/bot/DraftBot";

export const commandInfo: ITestCommand = {
	name: "dailytimeout",
	description: "Effectue un dailytimeout (action journalière qui actualise la potion du jour et retire des lovePoints des pets)"
};

/**
 * Do a dailytimeout
 */
const dailyTimeoutTestCommand: ExecuteTestCommandLike = async () => {
	await DraftBot.dailyTimeout();
	return "Vous avez effectué un dailytimeout !";
};

commandInfo.execute = dailyTimeoutTestCommand;
