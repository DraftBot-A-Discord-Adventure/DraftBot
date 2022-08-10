import {Entities} from "../../../../core/database/game/models/Entity";

module.exports.commandInfo = {
	name: "experience",
	aliases: ["xp"],
	commandFormat: "<experience>",
	typeWaited: {
		experience: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {experience} :star: !",
	description: "Mets l'expérience votre joueur à la valeur donnée",
	commandTestShouldReply: true
};

/**
 * Set the experience of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const experienceTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const maxXp = entity.Player.getExperienceNeededToLevelUp() * 2;
	if (args[0] < 0 || args[0] > maxXp) {
		throw new Error("Erreur experience : expérience donnée doit être comprise entre 0 et " + maxXp + " !");
	}
	entity.Player.experience = parseInt(args[0], 10);
	await entity.Player.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {experience: entity.Player.experience});
};

module.exports.execute = experienceTestCommand;