import {Entities} from "../../../../core/database/game/models/Entity";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "playerweeklyscore",
	aliases: ["weeklyscore"],
	commandFormat: "<weeklyscore>",
	typeWaited: {
		weeklyscore: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {weeklyscore} points de la semaine !",
	description: "Mets le score de la semaine de votre joueur à la valeur donnée",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set the weeklyscore of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerWeeklyScoreTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	entity.Player.weeklyScore = parseInt(args[0], 10);
	await entity.Player.save();

	return format(commandInfo.messageWhenExecuted, {weeklyscore: entity.Player.weeklyScore});
};

commandInfo.execute = playerWeeklyScoreTestCommand;
