/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
import {Translations} from "../Translations";
const Maps = require("../../core/Maps");

const executeSmallEvent = async function(message, language, entity, seEmbed) {

	const timeAdvanced = draftbotRandom.integer(10,50);

	Maps.advanceTime(entity.Player, timeAdvanced);
	entity.Player.save();

	seEmbed.setDescription(
		JsonReader.smallEvents.advanceTime.emote +
		Translations.getModule("smallEventsIntros",language).getRandom("intro") +
		format(Translations.getModule("smallEvents.advanceTime",language).getRandom("stories"),{
			time: timeAdvanced
		})
	);

	await message.channel.send({ embeds: [seEmbed] });
	log(entity.discordUserId + " advanced " + timeAdvanced + "minutes from a small event.");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};