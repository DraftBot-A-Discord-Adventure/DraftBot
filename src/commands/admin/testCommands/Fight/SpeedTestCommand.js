import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "speed",
	commandFormat: "<speed>",
	typeWaited: {
		speed: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {speed} :rocket:!",
	description: "Mets la vitesse de votre joueur à la valeur donnée"
};

/**
 * Set the speed of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const speedTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (args[0] < 0) {
		throw new Error("Erreur speed : speed donné inférieur à 0 interdit !");
	}
	entity.speed = parseInt(args[0],10);
	entity.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {speed: entity.speed});
};

module.exports.execute = speedTestCommand;