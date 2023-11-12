import {MapLocations} from "../../../../core/database/game/models/MapLocation";
import {MapLinks} from "../../../../core/database/game/models/MapLink";
import {Maps} from "../../../../core/maps/Maps";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {TravelTime} from "../../../../core/maps/TravelTime";
import {NumberChangeReason} from "../../../../core/constants/LogsConstants";
import {DraftbotInteraction} from "../../../../core/messages/DraftbotInteraction";

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
	execute: null // Defined later
};

/**
 * Teleport you on a given path
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {CommandInteraction} interaction
 * @param {String[]} args - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const travelTestCommand = async (language: string, interaction: DraftbotInteraction, args: string[]): Promise<string> => {

	const [player] = await Players.getOrRegister(interaction.user.id);

	const mapStart = parseInt(args[0], 10);
	const mapEnd = parseInt(args[1], 10);

	const link = await MapLinks.getLinkByLocations(mapStart, mapEnd);
	if (!link) {
		const connectedMapsWithStartLinks = await MapLinks.getLinksByMapStart(mapEnd);
		const conMapsWthStart = [];
		for (const l of connectedMapsWithStartLinks) {
			conMapsWthStart.push(l.endMap);
		}
		throw new Error(`Erreur travel : Maps non reliées. Maps reliées avec la map ${mapStart} : ${conMapsWthStart.toString()}`);
	}
	await TravelTime.removeEffect(player, NumberChangeReason.TEST);

	await Maps.startTravel(player, link, Date.now());
	await player.save();
	return format(commandInfo.messageWhenExecuted, {
		mapNameStart: (await MapLocations.getById(mapStart)).getDisplayName(language),
		mapNameEnd: (await MapLocations.getById(mapEnd)).getDisplayName(language)
	});
};

commandInfo.execute = travelTestCommand;