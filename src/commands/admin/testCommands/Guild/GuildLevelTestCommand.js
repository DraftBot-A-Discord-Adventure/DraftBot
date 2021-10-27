import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "guildlevel",
	aliases: ["glvl"],
	commandFormat: "<level>",
	typeWaited: {
		level: typeVariable.INTEGER
	},
	messageWhenExecuted: "Votre guilde est maintenant niveau {level} !",
	description: "Mets le niveau de votre guilde au niveau donné"
};

/**
 * Set your guild's level to the given integer
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const guildLevelTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	const guild = await Guilds.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur glvl : vous n'êtes pas dans une guilde !");
	}
	if (args[0] <= 0 || args[0] > 100) {
		throw new Error("Erreur glvl : niveau de guilde invalide ! Fourchette de niveau compris entre 0 et 100.");
	}
	guild.level = parseInt(args[0],10);
	guild.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {level: args[0]});
};

module.exports.execute = guildLevelTestCommand;