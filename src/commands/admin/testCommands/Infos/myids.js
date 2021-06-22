module.exports.help = {
	name: "myids",
	messageWhenExecuted: "Entity id: {entityId}\nPlayer id: {playerId}",
	description: "Montre vos IDs d'entité et de joueur"
};

/**
 * Show your entity's and player's IDs
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
const myids = (language, message) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	return format(module.exports.infos.messageWhenExecuted, {entityId: entity.id, playerId: entity.Player.id});
};

module.exports.execute = myids;