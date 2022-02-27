import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "advancetopggvotetime",
	aliases: ["topggatime"],
	commandFormat: "<time>",
	typeWaited: {
		time: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez avancé votre dernier vote top.gg de {time} minutes !",
	description: "Avance le dernier vote top.gg de votre joueur d'une durée en minutes donnée"
};

/**
 * Quick travel your topgg vote time of a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const advanceTopGGVoteTimeTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.Player.topggVoteAt -= parseInt(args[0]) * 60000;
	entity.Player.save();
	return format(module.exports.commandInfo.messageWhenExecuted, {time: args[0]});
};

module.exports.execute = advanceTopGGVoteTimeTestCommand;