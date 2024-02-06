import {Maps} from "../../../../core/maps/Maps";
import {ExecuteTestCommandLike, ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "mapinfo",
	description: "Donne des informations pratiques sur la map sur laquelle vous êtes"
};

/**
 * Give you information about the map you are on
 */
const mapInfosTestCommand: ExecuteTestCommandLike = async (player) => {
	const currMap = player.getDestination();
	const prevMap = player.getPreviousMap();
	const travelling = Maps.isTravelling(player);

	return `🗺️ Map debugging :
Previous map : ${prevMap ? `${prevMap.id /* TODO: i18n (previously currMap.getDisplayName(player.language))*/} (id: ${prevMap.id})` : "None"}
${travelling ? "Next map" : "Current map"} : ${currMap.id /* TODO: i18n (previously currMap.getDisplayName(player.language))*/} (id: ${currMap.id})
${travelling ? "" : `Next available maps : ${
		Maps.getNextPlayerAvailableMaps(player)
			.map(map => `${map /* TODO: i18n (previously currMap.getDisplayName(player.language))*/} (id: ${map})`)
			.join("\n")
	}`}
Players : :speech_balloon: ${await currMap.playersCount(prevMap.id)} player(s) on this map`;
};

commandInfo.execute = mapInfosTestCommand;