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
import { performance } from "perf_hooks";

declare const draftbotRandom: Random;
declare const JsonReader: any;
declare function format(s: string, replacement: any): string;

const executeSmallEvent = function(message: Message, language: string, entity: any, seEmbed: MessageEmbed) {
	let keysList = Object.keys(JsonReader.smallEvents.space.getTranslation(language).specific);
	if (JsonReader.app.NASA_API_KEY === "") {
		keysList = keysList.filter(e => e !== "neoWS");
	}
	const specificEvent = draftbotRandom.pick(keysList);

	const translationModule = Translations.getModule("smallEvents.space", language);
	const name = translationModule.getRandom("names");
	const se_intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
	const intro = format(translationModule.getRandom("intro"), { name });
	const search_action = translationModule.getRandom("search_action");
	const search = translationModule.getRandom("search");
	const action_intro = translationModule.getRandom("action_intro");
	const action = translationModule.getRandom("action");
	const outro = translationModule.getRandom("outro");

	const baseDescription = seEmbed.description;
	const messageBefore = format(translationModule.get("before_search_format"), {
		se_intro, intro, search_action, search
	});
	seEmbed.setDescription(baseDescription + messageBefore);
	message.channel.send(seEmbed).then(async (sentMessage) => {
		const waitTime = 5000;
		const t0 = performance.now();
		const replacements = eval(`${specificEvent}()`);
		const specific = format(translationModule.getRandom("specific." + specificEvent), replacements);
		const t1 = performance.now();
		const timeLeft = waitTime - (t1 - t0);
		const messageAfter = format(translationModule.get("after_search_format"), {
			se_intro, intro, search_action, search, action_intro, action, outro, specific
		});
		const callBack = async () => {
			seEmbed.setDescription(baseDescription + messageAfter);
			await sentMessage.edit(seEmbed);
		};
		if (timeLeft <= 0) {
			await callBack();
		}
		else {
			setTimeout(async function() {
				await callBack();
			}, timeLeft);
		}
	});

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
	const neoWSFeed = SpaceUtils.getNeoWSFeed(JsonReader.app.NASA_API_KEY);
	return {
		count: neoWSFeed.length
	};
}

module.exports = {
	executeSmallEvent: executeSmallEvent
};