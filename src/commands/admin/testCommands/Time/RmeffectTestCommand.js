module.exports.help = {
	name: "rmeffect",
	messageWhenExecuted: "Vous n'avez plus d'effets !",
	description: "Enlève votre effet actuel"
};

const Maps = require("../../../../core/Maps");

/**
 * Remove the effect of your player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
async function rmeffect(language, message) {
	const [entity] = await Entities.getOrRegister(message.author.id);

	await Maps.removeEffect(entity.Player);
	await entity.Player.save();
}

module.exports.execute = rmeffect;