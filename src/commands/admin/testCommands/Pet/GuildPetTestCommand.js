import {Entities} from "../../../../core/database/game/models/Entity";
import {GuildPets} from "../../../../core/database/game/models/GuildPet";
import {PetEntities} from "../../../../core/database/game/models/PetEntity";
import {Guilds} from "../../../../core/database/game/models/Guild";
import {format} from "../../../../core/utils/StringFormatter";
import {Pets} from "../../../../core/database/game/models/Pet";

module.exports.commandInfo = {
	name: "guildpet",
	aliases: ["gp"],
	commandFormat: "<id> <sex = m/f>",
	typeWaited: {
		id: typeVariable.INTEGER,
		sex: typeVariable.STRING
	},
	messageWhenExecuted: "Un pet a rejoint votre shelter :\n{petString} !",
	description: "Ajoute un pet à votre shelter de guilde avec un id et un sexe donnés",
	commandTestShouldReply: true
};

/**
 * Add a pet in your shelter with id and sex given
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const guildPetTestCommand = async (language, interaction, args) => {

	const [entity] = await Entities.getOrRegister(interaction.user.id);

	let guild = await Guilds.getById(entity.Player.guildId);
	if (guild === null) {
		throw new Error("Erreur guildpet : Vous n'avez pas de guilde !");
	}

	if (guild.isPetShelterFull()) {
		throw new Error("Erreur guildpet : Plus de place dans le shelter !");
	}

	if (!["m", "f"].includes(args[1])) {
		throw new Error("Erreur guildpet : sexe invalide.");
	}
	const maxIdPet = await Pets.getMaxId();
	if (args[0] >= maxIdPet || args[0] < 0) {
		throw new Error("Erreur guildpet : id invalide. L'id doit être compris entre 0 et " + maxIdPet + " !");
	}

	const pet = PetEntities.createPet(parseInt(args[0]), args[1], null);
	await pet.save();

	await (await GuildPets.addPet(guild.id, pet.id)).save();

	guild = await Guilds.getById(entity.Player.guildId); // recall needed to refresh the pet
	const newPet = guild.GuildPets[guild.GuildPets.length - 1];
	return format(
		module.exports.commandInfo.messageWhenExecuted, {
			petString: newPet.PetEntity.getPetDisplay(language)
		}
	);
};

module.exports.execute = guildPetTestCommand;