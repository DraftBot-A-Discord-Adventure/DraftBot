import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "clearbadges",
	commandFormat: "",
	messageWhenExecuted: "Vous avez supprimé vos badges !",
	description: "Supprime les badges de votre joueur"
};

/**
 * Delete all badges of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
const clearBadgesTestCommand = async (language, message) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.Player.badges = null;
	entity.Player.save();

	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = clearBadgesTestCommand;