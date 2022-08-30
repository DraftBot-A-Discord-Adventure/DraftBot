import {Entities} from "../../../../core/database/game/models/Entity";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Set the health of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerHealthTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const health = parseInt(args[0], 10);
	if (health < 0) {
		throw new Error("Erreur vie : vie donnée inférieure à 0 interdit !");
	}
	await entity.addHealth(parseInt(args[0], 10) - entity.health, interaction.channel, language, NumberChangeReason.TEST, {
		overHealCountsForMission: false,
		shouldPokeMission: false
	});
	await entity.save();

	return format(commandInfo.messageWhenExecuted, {health: entity.health});
};

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
	execute: playerHealthTestCommand
};