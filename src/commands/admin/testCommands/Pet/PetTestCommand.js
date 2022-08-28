import {Entities} from "../../../../core/database/game/models/Entity";
import {PetEntities} from "../../../../core/database/game/models/PetEntity";
import {Pets} from "../../../../core/database/game/models/Pet";
import {MissionsController} from "../../../../core/missions/MissionsController";
import {format} from "../../../../core/utils/StringFormatter";

/**
 * Give you a pet with id and sex given
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const petTestCommand = async (language, interaction, args) => {

	let [entity] = await Entities.getOrRegister(interaction.user.id);
	if (entity.Player.Pet) {
		await entity.Player.Pet.destroy();
	}

	if (args[0] === "0") {
		return "Vous n'avez plus de pet maintenant !";
	}
	if (!["m", "f"].includes(args[1])) {
		throw new Error("Erreur pet : sexe invalide.");
	}
	const maxIdPet = await Pets.getMaxId();
	if (args[0] > maxIdPet || args[0] < 0) {
		throw new Error("Erreur pet : id invalide. L'id doit être compris entre 0 et " + maxIdPet + " !");
	}

	const pet = PetEntities.createPet(parseInt(args[0]), args[1], null);
	await pet.save();
	entity.Player.setPet(entity, pet);
	await entity.Player.save();
	await MissionsController.update(entity, interaction.channel, language, {missionId: "havePet"});

	[entity] = await Entities.getOrRegister(interaction.user.id); // recall needed to refresh the pet
	return format(
		module.exports.commandInfo.messageWhenExecuted, {
			petString: entity.Player.Pet.getPetDisplay(language)
		}
	);
};

module.exports.commandInfo = {
	name: "pet",
	commandFormat: "<id> <sex = m/f>",
	typeWaited: {
		id: typeVariable.INTEGER,
		sex: typeVariable.STRING
	},
	messageWhenExecuted: "Vous avez un nouveau pet :\n{petString} !",
	description: "Vous donne un pet avec un id et un sexe donnés",
	commandTestShouldReply: true,
	execute: petTestCommand
};