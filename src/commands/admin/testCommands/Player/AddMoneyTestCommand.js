import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "addmoney",
	commandFormat: "<money>",
	typeWaited: {
		money: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {money} :moneybag: !",
	description: "Ajoute la valeur donnée d'argent à votre joueur"
};

/**
 * Add money to the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const addMoneyTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.Player.addMoney(parseInt(args[0]), message.channel, language);
	entity.Player.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {money: entity.Player.money});
};

module.exports.execute = addMoneyTestCommand;