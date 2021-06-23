module.exports.help = {
	name: "weeklyscore",
	commandFormat: "<weeklyscore>",
	typeWaited: {
		weeklyscore: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {weeklyscore} points de la semaine !",
	description: "Mets le score de la semaine de votre joueur à la valeur donnée"
};

/**
 * Set the weeklyscore of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const weeklyscore = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.Player.weeklyScore = parseInt(args[0],10);
	entity.Player.save();

	return format(module.exports.help.messageWhenExecuted, {weeklyscore: entity.Player.weeklyScore});
};

module.exports.execute = weeklyscore;