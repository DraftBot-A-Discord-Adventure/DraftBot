import {Entities} from "../../../../core/database/game/models/Entity";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "playerscore",
	aliases: ["score"],
	commandFormat: "<score>",
	typeWaited: {
		score: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {score} :medal: !",
	description: "Mets le score de votre joueur à la valeur donnée",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set the score of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerScoreTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const score = parseInt(args[0], 10);
	if (score < 100) {
		throw new Error("Erreur score : score donné inférieur à 100 interdit !");
	}
	await entity.Player.addScore(entity, score - entity.Player.score, interaction.channel, language, NumberChangeReason.TEST);
	await entity.Player.save();

	return format(commandInfo.messageWhenExecuted, {score: entity.Player.score});
};

commandInfo.execute = playerScoreTestCommand;