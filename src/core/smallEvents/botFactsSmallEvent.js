/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
import {Classes} from "../models/Class";
import {Guilds} from "../models/Guild";
import {PetEntities} from "../models/PetEntity";
import {Players} from "../models/Player";

const executeSmallEvent = async function(message, language, entity, seEmbed) {
	const translationBF = JsonReader.smallEvents.botFacts.getTranslation(language);
	const translationIntroSE = JsonReader.smallEventsIntros.getTranslation(language);

	const base = JsonReader.smallEvents.botFacts.emote + " " + translationIntroSE.intro[randInt(0, translationIntroSE.intro.length)];

	const outReceived = draftbotRandom.pick(Object.keys(translationBF.possiblesInfos));
	let result;
	let complement = "";
	let array = [];
	switch (outReceived) {
	case "nbMeanPoints":
		result = await Players.getNbMeanPoints();
		break;
	case "meanWeeklyScore":
		result = await Players.getMeanWeeklyScore();
		break;
	case "nbPlayersHaventStartedTheAdventure":
		result = await Players.getNbPlayersHaventStartedTheAdventure();
		break;
	case "levelMean":
		result = await Players.getLevelMean();
		break;
	case "nbMeanMoney":
		result = await Players.getNbMeanMoney();
		break;
	case "sumAllMoney":
		result = await Players.getSumAllMoney();
		break;
	case "richestPlayer":
		result = await Players.getRichestPlayer();
		break;
	case "trainedPets":
		result = await PetEntities.getNbTrainedPets();
		break;
	case "percentMalePets":
		result = Math.round(await PetEntities.getNbPetsGivenSex("m") / await PetEntities.getNbPets() * 10000) / 100;
		break;
	case "percentFemalePets":
		result = Math.round(await PetEntities.getNbPetsGivenSex("f") / await PetEntities.getNbPets() * 10000) / 100;
		break;
	case "guildLevelMean":
		result = await Guilds.getGuildLevelMean();
		break;
	case "feistyPets":
		result = await PetEntities.getNbFeistyPets();
		break;
	case "nbPlayersOnYourMap":
		result = await entity.Player.getNbPlayersOnYourMap();
		break;
	default:
		array = await getNbPlayersWithGivenClass(language);
		result = array[0];
		complement = array[1];
	}
	seEmbed.setDescription(base +
		format(
			translationBF.stories[draftbotRandom.pick(Object.keys(translationBF.stories))],
			{
				botFact: format(
					translationBF.possiblesInfos[outReceived],
					{
						infoNumber: result,
						infoComplement: complement
					}
				)
			}
		)
	);
	await message.channel.send({ embeds: [seEmbed] });
	log(entity.discordUserId + " got infos about people in the bot.");
};

/**
 * Gives how many players have a random class
 * @param {("fr"|"en")} language
 * @return {Promise<(*)[]>}
 */
const getNbPlayersWithGivenClass = async (language) => {
	const {readdir} = require("fs/promises");
	const classToCheck = await Classes.getById(parseInt(draftbotRandom.pick(await readdir("resources/text/classes"))
		.slice(0, -5), 10));
	const nbPlayersWithThisClass = await Players.getNbPlayersWithClass(classToCheck);
	let sentence = LANGUAGE.FRENCH ? " joueur" : " player";
	sentence += nbPlayersWithThisClass > 1 ? "s" : "";
	return [nbPlayersWithThisClass + sentence, classToCheck[language]];
};


module.exports = {
	executeSmallEvent: executeSmallEvent
};
