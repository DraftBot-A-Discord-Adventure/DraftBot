import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {Language} from "../../../../core/constants/TypeConstants";

export const commandInfo: ITestCommand = {
	name: "myids",
	commandFormat: "",
	messageWhenExecuted: "Player id: {playerId}",
	description: "Montre vos IDs d'entité et de joueur",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Show your player's IDs
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const myIDsTestCommand = async (language: Language, interaction: CommandInteraction): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	return format(commandInfo.messageWhenExecuted, { playerId: player.id });
};

commandInfo.execute = myIDsTestCommand;