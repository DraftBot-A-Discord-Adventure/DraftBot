module.exports.help = {
	name: "advancetravel",
	aliases: ["atravel"],
	commandFormat: "<time>",
	typeWaited: {
		time: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez avancé votre voyage de {time} minutes !",
	description: "Avance votre voyage d'une durée en minutes donnée"
};

const Maps = require("../../../../core/Maps");

/**
 * Quick travel your travel of a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const advanceTravelTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	Maps.advanceTime(entity.Player, parseInt(args[0]));
	entity.Player.save();
	return format(module.exports.help.messageWhenExecuted, {time: args[0]});
};

module.exports.execute = advanceTravelTestCommand;