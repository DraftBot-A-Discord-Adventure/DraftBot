/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @returns {Promise<void>}
 */
const executeSmallEvent = async function (message, language, entity) {
	await message.channel.send("ok");
}

module.exports = {
	executeSmallEvent: executeSmallEvent
};