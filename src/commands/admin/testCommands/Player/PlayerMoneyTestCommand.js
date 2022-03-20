import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "playermoney",
	aliases: ["money"],
	commandFormat: "<money>",
	typeWaited: {
		money: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {money} :moneybag: !",
	description: "Mets l'argent votre joueur à la valeur donnée"
};

/**
 * Set the money of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const playerMoneyTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	if (args[0] < 0) {
		throw new Error("Erreur money : argent donné inférieur à 0 interdit !");
	}
	entity.Player.money = parseInt(args[0], 10);
	await entity.Player.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {money: entity.Player.money});
};

module.exports.execute = playerMoneyTestCommand;