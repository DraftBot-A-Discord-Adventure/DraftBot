import {Maps} from "../../../../core/maps/Maps";
import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";
import {TravelTime} from "../../../../core/maps/TravelTime";
import {NumberChangeReason} from "../../../../../../Lib/src/constants/LogsConstants";
import {MapLinkDataController} from "../../../../data/MapLink";

export const commandInfo: ITestCommand = {
	name: "travel",
	aliases: ["tp"],
	commandFormat: "<idStart> <idEnd>",
	typeWaited: {
		idStart: TypeKey.INTEGER,
		idEnd: TypeKey.INTEGER
	},
	description: "Vous téléporte sur un chemin donné"
};

/**
 * Teleport you on a given path
 */
const travelTestCommand: ExecuteTestCommandLike = async (player, args) => {
	const mapStart = parseInt(args[0], 10);
	const mapEnd = parseInt(args[1], 10);

	const link = MapLinkDataController.instance.getLinkByLocations(mapStart, mapEnd);
	if (!link) {
		const connectedMapsWithStartLinks = MapLinkDataController.instance.getLinksByMapStart(mapEnd);
		const conMapsWthStart = [];
		for (const l of connectedMapsWithStartLinks) {
			conMapsWthStart.push(l.endMap);
		}
		throw new Error(`Erreur travel : Maps non reliées. Maps reliées avec la map ${mapStart} : ${conMapsWthStart.toString()}`);
	}
	await TravelTime.removeEffect(player, NumberChangeReason.TEST);

	await Maps.startTravel(player, link, Date.now());
	await player.save();
	return `Vous êtes téléportés entre la map ${
		mapStart/* TODO: i18n : (await MapLocations.getById(mapStart)).getDisplayName(language) */} et la map ${
		mapEnd/* TODO: i18n : (await MapLocations.getById(mapEnd)).getDisplayName(language) */} !`;
};

commandInfo.execute = travelTestCommand;