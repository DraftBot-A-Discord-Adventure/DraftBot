import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "playerhealth",
	aliases: ["health"],
	commandFormat: "<health>",
	typeWaited: {
		health: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {health} :heart:!",
	description: "Mets la vie de votre joueur à la valeur donnée",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set the health of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerHealthTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const health = parseInt(args[0], 10);
	if (health < 0) {
		throw new Error("Erreur vie : vie donnée inférieure à 0 interdit !");
	}
	await player.addHealth(parseInt(args[0], 10) - player.health, interaction.channel, language, NumberChangeReason.TEST, {
		overHealCountsForMission: false,
		shouldPokeMission: false
	});
	await player.save();

	return format(commandInfo.messageWhenExecuted, {health: player.health});
};

commandInfo.execute = playerHealthTestCommand;