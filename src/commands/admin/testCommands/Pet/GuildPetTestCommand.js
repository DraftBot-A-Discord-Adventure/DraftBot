import {Entities} from "../../../../core/models/Entity";
import {GuildPets} from "../../../../core/models/GuildPet";

module.exports.commandInfo = {
	name: "guildpet",
	aliases: ["gp"],
	commandFormat: "<id> <sex = m/f>",
	typeWaited: {
		id: typeVariable.INTEGER,
		sex: typeVariable.STRING
	},
	messageWhenExecuted: "Un pet a rejoint votre shelter :\n{petString} !",
	description: "Ajoute un pet à votre shelter de guilde avec un id et un sexe donnés"
};

/**
 * Add a pet in your shelter with id and sex given
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const guildPetTestCommand = async (language, message, args) => {

	const [entity] = await Entities.getOrRegister(message.author.id);

	let guild = await Guilds.getById(entity.Player.guildId);
	if (guild === null) {
		throw new Error("Erreur guildpet : Vous n'avez pas de guilde !");
	}

	if (Guilds.isPetShelterFull(guild)) {
		throw new Error("Erreur guildpet : Plus de place dans le shelter !");
	}

	if (!["m","f"].includes(args[1])) {
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
			petString: await PetEntities.getPetDisplay(newPet.PetEntity, language)
		}
	);
};

module.exports.execute = guildPetTestCommand;