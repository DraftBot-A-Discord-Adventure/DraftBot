import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "fightpointslost",
	aliases: ["fpl"],
	commandFormat: "<lostPoints>",
	typeWaited: {
		lostPoints: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {lostPoints} fightpointslost !",
	description: "Mets les fightpointslost de votre joueur à la valeur donnée"
};

/**
 * Set fightpointslost of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const fightPointsLostTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	entity.fightPointsLost = parseInt(args[0],10);
	entity.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {lostPoints: args[0]});
};

module.exports.execute = fightPointsLostTestCommand;