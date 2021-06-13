module.exports.infos = {
	name: "petlp",
	commandFormat: "<lovePoints>",
	typeWaited: {
		lovePoints: typeVariable.INTEGER
	},
	messageWhenExecuted: "Votre pet a maintenant un amour de {love}. Cela correspond à un pet {loveLevel} !",
	description: "Mets le niveau d'amour de votre pet au niveau donné"
};

/**
 * Set the lovePoints of your pet
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
async function petlp(language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);
	const pet = await entity.Player.Pet;
	if (pet === null) {
		throw new Error("Erreur petlp : vous n'avez pas de pet !");
	}
	if (args[0] < 0 || args[0] > 100) {
		throw new Error("Erreur petlp : lovePoints invalide ! Fourchette de lovePoints comprise entre 0 et 100.");
	}
	pet.lovePoints = parseInt(args[0]);
	pet.save();
	return format(
		module.exports.infos.messageWhenExecuted, {
			love: args[0],
			loveLevel: PetEntities.getLoveLevel(pet, language)
		}
	);
}

module.exports.execute = petlp;