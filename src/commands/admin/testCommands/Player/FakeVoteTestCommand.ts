/**
 * Simulate a topgg vote
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";

const fakeVoteTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	await require("../../../../core/DBL").userDBLVote(interaction.user.id);
	return commandInfo.messageWhenExecuted;
};

export const commandInfo: ITestCommand = {
	name: "fakevote",
	commandFormat: "",
	messageWhenExecuted: "Vous avez faussement voté !",
	description: "Effectue un faux vote",
	commandTestShouldReply: true,
	execute: fakeVoteTestCommand
};