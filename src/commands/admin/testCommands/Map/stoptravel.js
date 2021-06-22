module.exports.help = {
	name: "stoptravel",
	aliases: ["stravel"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez arrêté de voyager !",
	description: "Stoppe le voyage en cours"
};

const Maps = require("../../../../core/Maps");

/**
 * Stop your current travel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
const stoptravel = (language, message) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (!Maps.isTravelling(entity.Player)) {
		throw new Error("Erreur stoptravel : vous ne voyagez pas actuellement !");
	}

	await Maps.stopTravel(entity.Player);

	return module.exports.infos.messageWhenExecuted;

};

module.exports.execute = stoptravel;