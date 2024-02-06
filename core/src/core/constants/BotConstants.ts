export abstract class BotConstants {
	static readonly VERSION = import("../../../package.json").then(json => json.version);

	static readonly MAP_URL = "https://draftbot.com/public/ressources/map.jpg"; // Unused, but useful

	static readonly MAP_URL_WITH_CURSOR = "https://draftbot.com/public/ressources/mapsCursed/{mapLink}map.jpg";

	static readonly FORCED_MAPS_URL = "https://draftbot.com/public/ressources/maps/{name}.jpg";
}