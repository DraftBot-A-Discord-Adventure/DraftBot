import {DraftBotEmbed} from "../../../../core/messages/DraftBotEmbed";
import {Entities} from "../../../../core/database/game/models/Entity";
import {MapLocations} from "../../../../core/database/game/models/MapLocation";
import {Maps} from "../../../../core/Maps";
import {CommandInteraction} from "discord.js";
import {millisecondsToMinutes, parseTimeDifference} from "../../../../core/utils/TimeUtils";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "mapinfo",
	messageWhenExecuted: "",
	description: "Donne des informations pratiques sur la map sur laquelle vous êtes",
	commandTestShouldReply: true,
	commandFormat: "",
	execute: null // defined later
};

/**
 * Give you information about the map you are on
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const mapInfosTestCommand = async (language: string, interaction: CommandInteraction): Promise<DraftBotEmbed> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);

	const mapEmbed = new DraftBotEmbed();
	const currMap = await entity.Player.getDestination();
	const prevMap = await entity.Player.getPreviousMap();
	const travelling = Maps.isTravelling(entity.Player);

	mapEmbed.formatAuthor("🗺️ Map debugging", interaction.user)
		.addFields({
			name: travelling ? "Next map" : "Current map",
			value: currMap.getDisplayName(language) + " (id: " + currMap.id + ")",
			inline: true
		})
		.addFields({
			name: "Previous map",
			value: prevMap ? prevMap.getDisplayName(language) + " (id: " + prevMap.id + ")" : "None",
			inline: true
		})
		.addFields({
			name: "Travelling",
			value: Maps.isTravelling(entity.Player) ? ":clock1: For " + parseTimeDifference(0, millisecondsToMinutes(Maps.getTravellingTime(entity.Player)), language) : ":x: No",
			inline: true
		})
		.setColor(Constants.TEST_EMBED_COLOR.SUCCESSFUL);

	if (!travelling) {
		const availableMaps = await Maps.getNextPlayerAvailableMaps(entity.Player);
		let field = "";
		for (let i = 0; i < availableMaps.length; ++i) {
			const map = await MapLocations.getById(availableMaps[i]);
			field += map.getDisplayName(language) + " (id: " + map.id + ")" + "\n";
		}
		mapEmbed.addFields({name: "Next available maps", value: field, inline: true});
	}
	else {
		mapEmbed.addFields({
			name: "Players",
			value: ":speech_balloon: " + await currMap.playersCount(prevMap.id) + " player(s) on this map",
			inline: true
		});
	}
	return mapEmbed;
};

commandInfo.execute = mapInfosTestCommand;