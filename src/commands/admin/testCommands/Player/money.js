module.exports.infos = {
	name: "money",
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
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
async function money(language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (args[0] < 0) {
		throw new Error("Erreur money : argent donné inférieur à 0 interdit !");
	}
	entity.Player.money = parseInt(args[0],10);
	entity.Player.save();

	return format(module.exports.infos.messageWhenExecuted, {money: entity.Player.money});
}

module.exports.execute = money;