module.exports.help = {
	name: "jailplayer",
	aliases: ["jail"],
	commandFormat: "<mention>",
	typeWaited: {
		mention: typeVariable.MENTION
	},
	messageWhenExecuted: "Vous avez enfermé {player} !",
	description: "Enferme le joueur donné"
};

const Maps = require("../../../../core/Maps");

/**
 * Jail the given player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const jailPlayerTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(getIdFromMention(args[0]));
	await Maps.applyEffect(entity.Player, ":lock:");
	await entity.Player.save();
	return format(module.exports.help.messageWhenExecuted, {player: args[0]});
};

module.exports.execute = jailPlayerTestCommand;