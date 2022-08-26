import {Entities} from "../../../../core/database/game/models/Entity";
import {format} from "../../../../core/utils/StringFormatter";

/**
 * Set the lovePoints of your pet
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const petLovePointsTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const pet = await entity.Player.Pet;
	if (pet === null) {
		throw new Error("Erreur petlp : vous n'avez pas de pet !");
	}
	if (args[0] < 0 || args[0] > 100) {
		throw new Error("Erreur petlp : lovePoints invalide ! Fourchette de lovePoints comprise entre 0 et 100.");
	}
	await pet.changeLovePoints(parseInt(args[0], 10) - pet.lovePoints, entity, interaction.channel, language);
	await pet.save();
	return format(
		module.exports.commandInfo.messageWhenExecuted, {
			love: args[0],
			loveLevel: pet.getLoveLevel(language)
		}
	);
};

module.exports.commandInfo = {
	name: "petlovepoints",
	aliases: ["petlp"],
	commandFormat: "<lovePoints>",
	typeWaited: {
		lovePoints: typeVariable.INTEGER
	},
	messageWhenExecuted: "Votre pet a maintenant un amour de {love}. Cela correspond à un pet {loveLevel} !",
	description: "Mets le niveau d'amour de votre pet au niveau donné",
	commandTestShouldReply: true,
	execute: petLovePointsTestCommand
};