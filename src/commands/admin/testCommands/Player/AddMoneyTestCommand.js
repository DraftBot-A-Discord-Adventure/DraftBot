import {Entities} from "../../../../core/database/game/models/Entity";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";

/**
 * Add money to the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const addMoneyTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	await entity.Player.addMoney(entity, parseInt(args[0]), interaction.channel, language, NumberChangeReason.TEST);
	await entity.Player.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {money: entity.Player.money});
};

module.exports.commandInfo = {
	name: "addmoney",
	commandFormat: "<money>",
	typeWaited: {
		money: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {money} :moneybag: !",
	description: "Ajoute la valeur donnée d'argent à votre joueur",
	commandTestShouldReply: true,
	execute: addMoneyTestCommand
};