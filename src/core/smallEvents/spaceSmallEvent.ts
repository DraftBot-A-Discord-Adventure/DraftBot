/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send.
 *    The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
import {Message, MessageEmbed} from "discord.js";
import {SpaceUtils} from "../utils/SpaceUtils";
import {Random} from "random-js";
import {Translations} from "../Translations";

declare const draftbotRandom: Random;
declare const JsonReader: any;

const executeSmallEvent = function(message: Message, language: string, entity: any, seEmbed: MessageEmbed) {
	const specificEvent = draftbotRandom.pick(Object.keys(JsonReader.smallEvents.space.getTranslation(language).specific));

	const translationModule = Translations.getModule("smallEvents.space", language);
	const intro = translationModule.getRandom("intro");
	const action = translationModule.getRandom("action");
	const specific = translationModule.getRandom("action");

	/* const posMars = SpaceUtils.computeEclipticCoordinates(Planet.MARS, new Date(2021, 9, 4).getTime() / 1000);
	const posEarth = SpaceUtils.computeEclipticCoordinates(Planet.EARTH, new Date(2021, 9, 4).getTime() / 1000);
	console.log(new Date().getTime());
	console.log(posMars);
	console.log(posEarth);
	const distMarsEarthX = posEarth[0];
	const distMarsEarthY = posEarth[1];
	const distMarsEarthZ = posEarth[2];
	console.log(Math.sqrt(distMarsEarthX ** 2 + distMarsEarthY ** 2 + distMarsEarthZ ** 2) * 149597870.7); */
};

function neoWS(): Record<string, unknown> {
	const neoWSFeed = SpaceUtils.getNeoWSFeed();
	return {
		count: neoWSFeed.length
	};
}

module.exports = {
	executeSmallEvent: executeSmallEvent
};