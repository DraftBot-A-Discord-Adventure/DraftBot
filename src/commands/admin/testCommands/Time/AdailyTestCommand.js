module.exports.help = {
	name: "adaily",
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
async function adaily(language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.Player.Inventory.lastDailyAt -= parseInt(args[0]) * 60000;
	entity.Player.Inventory.save();
	return format(module.exports.help.messageWhenExecuted, {time: args[0]});
}

module.exports.execute = adaily;