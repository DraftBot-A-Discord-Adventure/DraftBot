import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "advanceguilddaily",
	aliases: ["agd"],
	commandFormat: "<time>",
	typeWaited: {
		time: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez avancé votre gd de {time} minutes !",
	description: "Avance le gd de votre joueur d'une durée en minutes donnée"
};

/**
 * Quick travel your gd of a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const advanceGuildDailyTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	const guild = await Guilds.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur agd : vous n'êtes pas dans une guilde !");
	}
	guild.lastDailyAt -= parseInt(args[0]) * 60000;
	guild.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {time: args[0]});
};

module.exports.execute = advanceGuildDailyTestCommand;