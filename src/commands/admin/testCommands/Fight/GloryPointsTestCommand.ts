import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {NumberChangeReason} from "../../../../core/constants/LogsConstants";

export const commandInfo: ITestCommand = {
	name: "glorypoints",
	aliases: ["glory"],
	commandFormat: "<points>",
	typeWaited: {
		points: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {points} :sparkles: !",
	description: "Mets les glory points votre joueur à la valeur donnée",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set the glory points of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const gloryPointsTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const gloryPoints = parseInt(args[0], 10);
	if (gloryPoints < 0) {
		throw new Error("Erreur glory points : glory points inférieurs à 0 interdits !");
	}
	await player.setGloryPoints(gloryPoints, NumberChangeReason.TEST, interaction.channel, language);
	await player.save();

	return format(commandInfo.messageWhenExecuted, {points: player.gloryPoints});
};

commandInfo.execute = gloryPointsTestCommand;