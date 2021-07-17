module.exports.commandInfo = {
	name: "travel",
	aliases: ["tp"],
	commandFormat: "<idStart> <idEnd>",
	typeWaited: {
		idStart: typeVariable.INTEGER,
		idEnd: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous êtes téléportés entre la map {mapNameStart} et la map {mapNameEnd} !",
	description: "Vous téléporte sur un chemin donné"
};

const Maps = require("../../../../core/Maps");

/**
 * Teleport you on a given path
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const travelTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);

	const idMaxMap = await MapLocations.getIdMaxMap();
	if (args[0] > idMaxMap || args[0] <= 0) {
		throw new Error("Erreur travel : Map avec idStart inexistante. idStart doit être compris entre 1 et " + idMaxMap);
	}
	if (args[1] > idMaxMap || args[1] <= 0) {
		throw new Error("Erreur travel : Map avec idEnd inexistante. idEnd doit être compris entre 1 et " + idMaxMap);
	}

	const mapStart = await MapLocations.getById(parseInt(args[0]));
	const linkedMapToStart = [mapStart.westMap, mapStart.northMap, mapStart.eastMap, mapStart.southMap];
	if (!linkedMapToStart.includes(parseInt(args[1]))) {
		throw new Error("Erreur travel : Maps non reliées. Map reliées avec la " + args[0] + " : " + linkedMapToStart);
	}

	await Maps.startTravel(entity.Player, parseInt(args[1]), message.createdAt.getTime());
	entity.Player.previousMapId = args[0];
	await entity.Player.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {
		mapNameStart: (await MapLocations.getById(args[0])).getDisplayName(language),
		mapNameEnd: (await MapLocations.getById(args[1])).getDisplayName(language)
	});
};

module.exports.execute = travelTestCommand;