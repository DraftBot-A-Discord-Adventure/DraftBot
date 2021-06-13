module.exports.infos = {
	name: "pet",
	commandFormat: "<id> <sex = m/f>",
	typeWaited: {
		id: typeVariable.INTEGER,
		sex: typeVariable.STRING
	},
	messageWhenExecuted: "Vous avez un nouveau pet :\n{petString} !",
	description: "Vous donne un pet avec un id et un sexe donnés"
};

/**
 * Give you a pet with id and sex given
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
async function pet(language, message, args) {

	let [entity] = await Entities.getOrRegister(message.author.id);
	if (entity.Player.Pet) {
		await entity.Player.Pet.destroy();
	}

	if (args[0] === "0") {
		return "Vous n'avez plus de pet maintenant !";
	}
	if (!["m","f"].includes(args[1])) {
		throw new Error("Erreur pet : sexe invalide.");
	}
	const maxIdPet = await Pets.getMaxId();
	if (args[0] > maxIdPet || args[0] < 0) {
		throw new Error("Erreur pet : id invalide. L'id doit être compris entre 0 et " + maxIdPet + " !");
	}

	const pet = PetEntities.createPet(parseInt(args[0]), args[1], null);
	await pet.save();
	entity.Player.petId = pet.id;
	await entity.Player.save();

	[entity] = await Entities.getOrRegister(message.author.id); // recall needed to refresh the pet
	return format(
		module.exports.infos.messageWhenExecuted, {
			petString: await PetEntities.getPetDisplay(await entity.Player.Pet, language)
		}
	);
}

module.exports.execute = pet;