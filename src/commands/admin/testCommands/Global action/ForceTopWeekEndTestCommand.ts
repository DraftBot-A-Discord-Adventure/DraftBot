import {DraftBot} from "../../../../core/bot/DraftBot";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Force a topweek end event
 * @return {String} - The successful message formatted
 */
const forceTopWeekEndTestCommand = async (): Promise<string> => {
	await DraftBot.topWeekEnd();

	return commandInfo.messageWhenExecuted;
};

export const commandInfo: ITestCommand = {
	name: "forcetopweekend",
	aliases: ["forcetwe"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez effectué une fin de topweek !",
	description: "Effectue une fin de topweek (action hebdomadaire qui réinitialise le topweek, et qui annonce le gagnant de la semaine)",
	commandTestShouldReply: true,
	execute: forceTopWeekEndTestCommand
};