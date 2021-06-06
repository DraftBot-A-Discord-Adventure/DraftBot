/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send.
 *    The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function(message, language, entity, seEmbed) {

	const tr = JsonReader.small_events.staffMember.getTranslation(language);
	const keys = Object.keys(tr.members);
	const key = keys[randInt(0, keys.length)];
	seEmbed.setDescription(
		seEmbed.description + " "
		+ format(tr.context[randInt(0, tr.context.length)], {
			pseudo: key,
			sentence: tr.members[key]
		}));
	await message.channel.send(seEmbed);
	log(entity.discordUser_id + " met a staff member.");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};