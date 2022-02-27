import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "advanceplayerdaily",
	aliases: ["adaily"],
	commandFormat: "<time>",
	typeWaited: {
		time: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez avancé votre daily de {time} minutes !",
	description: "Avance le daily de votre joueur d'une durée en minutes donnée"
};

/**
 * Quick travel your daily of a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const advancePlayerDailyTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.Player.InventoryInfo.lastDailyAt -= parseInt(args[0]) * 60000;
	entity.Player.InventoryInfo.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {time: args[0]});
};

module.exports.execute = advancePlayerDailyTestCommand;