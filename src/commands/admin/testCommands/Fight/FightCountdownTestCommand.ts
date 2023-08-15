import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "fightcountdown",
	aliases: ["fcd"],
	commandFormat: "<countdown>",
	typeWaited: {
		lostPoints: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {countdown} de fightcountdown !",
	description: "Mets le fightcountdown de votre joueur à la valeur donnée",
	commandTestShouldReply: true,
	execute: null // Defined later
};

/**
 * Set fightcountdown of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const fightCountdownTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	player.fightCountdown = parseInt(args[0], 10);
	await player.save();

	return format(commandInfo.messageWhenExecuted, {countdown: args[0]});
};

commandInfo.execute = fightCountdownTestCommand;