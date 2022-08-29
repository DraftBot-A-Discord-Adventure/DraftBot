import {Entities} from "../../../../core/database/game/models/Entity";
import {MapLocations} from "../../../../core/database/game/models/MapLocation";
import {MapLinks} from "../../../../core/database/game/models/MapLink";
import {Maps} from "../../../../core/Maps";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {format} from "../../../../core/utils/StringFormatter";

/**
 * Teleport you on a given path
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {CommandInteraction} interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const travelTestCommand = async (language, interaction, args) => {

	const [entity] = await Entities.getOrRegister(interaction.user.id);

	const idMaxMap = await MapLocations.getIdMaxMap();
	if (args[0] > idMaxMap || args[0] <= 0) {
		throw new Error(`Erreur travel : Map avec idStart inexistante. idStart doit être compris entre 1 et ${idMaxMap}`);
	}
	if (args[1] > idMaxMap || args[1] <= 0) {
		throw new Error(`Erreur travel : Map avec idEnd inexistante. idEnd doit être compris entre 1 et ${idMaxMap}`);
	}

	const link = await MapLinks.getLinkByLocations(parseInt(args[0], 10), parseInt(args[1], 10));
	if (!link) {
		const connectedMapsWithStartLinks = await MapLinks.getLinksByMapStart(parseInt(args[0], 10));
		const conMapsWthStart = [];
		for (const l of connectedMapsWithStartLinks) {
			conMapsWthStart.push(l.endMap);
		}
		throw new Error(`Erreur travel : Maps non reliées. Maps reliées avec la map ${parseInt(args[0], 10)} : ${conMapsWthStart}`);
	}

	await Maps.startTravel(entity.Player, link, interaction.createdAt.valueOf(), NumberChangeReason.TEST);
	await entity.Player.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {
		mapNameStart: (await MapLocations.getById(parseInt(args[0], 10))).getDisplayName(language),
		mapNameEnd: (await MapLocations.getById(parseInt(args[1], 10))).getDisplayName(language)
	});
};

module.exports.commandInfo = {
	name: "travel",
	aliases: ["tp"],
	commandFormat: "<idStart> <idEnd>",
	typeWaited: {
		idStart: typeVariable.INTEGER,
		idEnd: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous êtes téléportés entre la map {mapNameStart} et la map {mapNameEnd} !",
	description: "Vous téléporte sur un chemin donné",
	commandTestShouldReply: true,
	execute: travelTestCommand
};
