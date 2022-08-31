import {Entities} from "../../../../core/database/game/models/Entity";
import {MapLocations} from "../../../../core/database/game/models/MapLocation";
import {MapLinks} from "../../../../core/database/game/models/MapLink";
import {Maps} from "../../../../core/Maps";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "travel",
	aliases: ["tp"],
	commandFormat: "<idStart> <idEnd>",
	typeWaited: {
		idStart: Constants.TEST_VAR_TYPES.INTEGER,
		idEnd: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous êtes téléportés entre la map {mapNameStart} et la map {mapNameEnd} !",
	description: "Vous téléporte sur un chemin donné",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Teleport you on a given path
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {CommandInteraction} interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const travelTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {

	const [entity] = await Entities.getOrRegister(interaction.user.id);

	const idMaxMap = await MapLocations.getIdMaxMap();
	const mapStart = parseInt(args[0], 10);
	const mapEnd = parseInt(args[0], 10);
	if (mapStart > idMaxMap || mapStart <= 0) {
		throw new Error(`Erreur travel : Map avec idStart inexistante. idStart doit être compris entre 1 et ${idMaxMap}`);
	}
	if (mapEnd > idMaxMap || mapEnd <= 0) {
		throw new Error(`Erreur travel : Map avec idEnd inexistante. idEnd doit être compris entre 1 et ${idMaxMap}`);
	}

	const link = await MapLinks.getLinkByLocations(mapStart, mapEnd);
	if (!link) {
		const connectedMapsWithStartLinks = await MapLinks.getLinksByMapStart(mapEnd);
		const conMapsWthStart = [];
		for (const l of connectedMapsWithStartLinks) {
			conMapsWthStart.push(l.endMap);
		}
		throw new Error(`Erreur travel : Maps non reliées. Maps reliées avec la map ${mapStart} : ${conMapsWthStart}`);
	}

	await Maps.startTravel(entity.Player, link, interaction.createdAt.valueOf(), NumberChangeReason.TEST);
	await entity.Player.save();
	return format(commandInfo.messageWhenExecuted, {
		mapNameStart: (await MapLocations.getById(mapStart)).getDisplayName(language),
		mapNameEnd: (await MapLocations.getById(mapEnd)).getDisplayName(language)
	});
};

commandInfo.execute = travelTestCommand;