import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "experience",
	aliases: ["xp"],
	commandFormat: "<experience>",
	typeWaited: {
		experience: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {experience} :star: !",
	description: "Mets l'expérience votre joueur à la valeur donnée",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set the experience of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const experienceTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const maxXp = player.getExperienceNeededToLevelUp() * 2;
	const xp = parseInt(args[0], 10);
	if (xp < 0 || xp > maxXp) {
		throw new Error("Erreur experience : expérience donnée doit être comprise entre 0 et " + maxXp + " !");
	}
	await player.addExperience({
		entity: player,
		amount: xp - player.experience,
		channel: interaction.channel,
		language,
		reason: NumberChangeReason.TEST
	});
	await player.save();

	return format(commandInfo.messageWhenExecuted, {experience: player.experience});
};

commandInfo.execute = experienceTestCommand;