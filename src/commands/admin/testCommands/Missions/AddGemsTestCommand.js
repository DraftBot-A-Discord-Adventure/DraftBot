import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "addgem",
	commandFormat: "<gem>",
	typeWaited: {
		money: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {gem} :gem: !",
	description: "Ajoute la valeur donnée de gemmes à votre joueur"
};

/**
 * Add gems to the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const addGemsTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.Player.PlayerMissionsInfo.addGems(parseInt(args[0]));
	entity.Player.PlayerMissionsInfo.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {gem: entity.Player.PlayerMissionsInfo.gems});
};

module.exports.execute = addGemsTestCommand;