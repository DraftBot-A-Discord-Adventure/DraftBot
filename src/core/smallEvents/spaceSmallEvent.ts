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
import {NearEarthObject, SpaceUtils} from "../utils/SpaceUtils";
import {Random} from "random-js";
import {TranslationModule, Translations} from "../Translations";
import {performance} from "perf_hooks";
import {MoonPhase, NextLunarEclipse, SearchLunarEclipse, SearchMoonQuarter} from "../utils/astronomy";

declare const draftbotRandom: Random;
declare const JsonReader: any;
declare function format(s: string, replacement: any): string;

const executeSmallEvent = async function(message: Message, language: string, entity: any, seEmbed: MessageEmbed) {
	let keysList = Object.keys(JsonReader.smallEvents.space.getTranslation(language).specific);
	if ((await nextFullMoon()).days === 0) {
		keysList = keysList.filter(e => e !== "nextFullMoon");
	}

	const translationModule = Translations.getModule("smallEvents.space", language);
	const name = translationModule.getRandom("names");
	const se_intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
	const intro = format(translationModule.getRandom("intro"), {name});
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
	message.channel.send({ embeds: [seEmbed] }).then(async (sentMessage) => {
		const waitTime = 5000;
		const t0 = performance.now();
		if (JsonReader.app.NASA_API_KEY === "" || (await SpaceUtils.getNeoWSFeed(JsonReader.app.NASA_API_KEY)).length < 2) {
			keysList = keysList.filter(e => e !== "neoWS");
		}
		const specificEvent = draftbotRandom.pick(keysList);
		eval(`${specificEvent}(translationModule)`).then((replacements: Record<string, unknown>) => {
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
				callBack().then();
			}
			else {
				setTimeout(async function() {
					await callBack();
				}, timeLeft);
			}
		});
	});
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function neoWS(): Promise<Record<string, unknown>> {
	const neoWSFeed = await SpaceUtils.getNeoWSFeed(JsonReader.app.NASA_API_KEY);
	const randomObject: NearEarthObject = draftbotRandom.pick(neoWSFeed.near_earth_objects);
	return Promise.resolve({
		count: neoWSFeed.near_earth_objects.length,
		randomObjectName: randomObject.name,
		randomObjectDistance: Math.floor(parseInt(randomObject.close_approach_data[0].miss_distance.kilometers) / 1000000),
		randomObjectDiameter: Math.floor((randomObject.estimated_diameter.meters.estimated_diameter_max + randomObject.estimated_diameter.meters.estimated_diameter_min) / 2)
	});
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function moonPhase(translationModule: TranslationModule): Promise<Record<string, unknown>> {
	return Promise.resolve({
		moonPhase: translationModule.getFromArray("moonPhases", SearchMoonQuarter(new Date()).quarter)
	});
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function nextFullMoon(): Promise<Record<string, unknown>> {
	let days = 0;
	const currDate = new Date();
	let currDegrees = MoonPhase(currDate);
	let nextDegrees = MoonPhase(new Date(currDate.getDate() + 1));
	while (!(currDegrees <= 180 && nextDegrees > 180)) {
		currDegrees = nextDegrees;
		currDate.setDate(currDate.getDate() + 1);
		nextDegrees = MoonPhase(currDate);
		days++;
	}
	return Promise.resolve({ days });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function nextPartialLunarEclipse(): Promise<Record<string, unknown>> {
	let eclipse = SearchLunarEclipse(new Date());
	for (;;) {
		if (eclipse.kind === "partial") {
			break;
		}
		eclipse = NextLunarEclipse(eclipse.peak);
	}
	return Promise.resolve({
		days: Math.floor((eclipse.peak.date.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
	});
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function nextTotalLunarEclipse(): Promise<Record<string, unknown>> {
	let eclipse = SearchLunarEclipse(new Date());
	for (;;) {
		if (eclipse.kind === "total") {
			break;
		}
		eclipse = NextLunarEclipse(eclipse.peak);
	}
	return Promise.resolve({
		days: Math.floor((eclipse.peak.date.getTime() - new Date().getTime()) / (1000 * 3600 * 24))
	});
}

module.exports = {
	executeSmallEvent: executeSmallEvent
};