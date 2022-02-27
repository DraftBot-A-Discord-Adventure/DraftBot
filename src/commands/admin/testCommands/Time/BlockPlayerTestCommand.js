import {Entities} from "../../../../core/models/Entity";
import {BlockingUtils} from "../../../../core/utils/BlockingUtils";

module.exports.commandInfo = {
	name: "blockplayer",
	aliases: ["block"],
	commandFormat: "<time>",
	typeWaited: {
		time: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous êtes maintenant bloqué pendant {time} secondes !",
	description: "Vous bloque pendant un temps en secondes donné"
};

/**
 * Block your player for a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const blockPlayerTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	if (args[0] <= 0) {
		throw new Error("Erreur block : on ne peut pas vous bloquer pendant un temps négatif ou nul !");
	}
	const sec = parseInt(args[0],10);
	const collector = message.createReactionCollector({
		filter: () => true,
		time: sec * 1000
	});
	/* eslint-disable @typescript-eslint/no-empty-function */
	collector.on("collect", () => {
	});
	collector.on("end", () => {
	});
	/* eslint-enable @typescript-eslint/no-empty-function */
	BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "test", collector);
	return format(module.exports.commandInfo.messageWhenExecuted, {time: sec});
};

module.exports.execute = blockPlayerTestCommand;