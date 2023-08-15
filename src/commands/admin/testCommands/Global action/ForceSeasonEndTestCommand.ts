import {DraftBot} from "../../../../core/bot/DraftBot";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "forceseasonend",
	aliases: ["forcesea"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez effectué une fin de saison !",
	description: "Effectue une fin de saison (action hebdomadaire qui réinitialise le classement glorieux, et qui annonce le gagnant de la semaine)",
	commandTestShouldReply: true,
	execute: null // Defined later
};

/**
 * Force a season end event
 * @return {String} - The successful message formatted
 */
const forceTopWeekEndTestCommand = async (): Promise<string> => {
	await DraftBot.seasonEnd();

	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = forceTopWeekEndTestCommand;