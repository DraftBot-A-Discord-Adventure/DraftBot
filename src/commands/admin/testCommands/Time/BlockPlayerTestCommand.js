import {Entities} from "../../../../core/database/game/models/Entity";
import {BlockingUtils} from "../../../../core/utils/BlockingUtils";
import {BlockingConstants} from "../../../../core/constants/BlockingConstants";

/**
 * Block your player for a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const blockPlayerTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	if (args[0] <= 0) {
		throw new Error("Erreur block : on ne peut pas vous bloquer pendant un temps négatif ou nul !");
	}
	const sec = parseInt(args[0], 10);
	const messageToReact = await interaction.reply({content: "je suis un message qui va te bloquer", fetchReply: true});
	const collector = messageToReact.createReactionCollector({
		filter: () => true,
		time: sec * 1000
	});
	/* eslint-disable @typescript-eslint/no-empty-function */
	collector.on("collect", () => {
	});
	collector.on("end", () => {
	});
	/* eslint-enable @typescript-eslint/no-empty-function */
	BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.TEST, collector);
	return format(module.exports.commandInfo.messageWhenExecuted, {time: sec});
};

module.exports.commandInfo = {
	name: "blockplayer",
	aliases: ["block"],
	commandFormat: "<time>",
	typeWaited: {
		time: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous êtes maintenant bloqué pendant {time} secondes !",
	description: "Vous bloque pendant un temps en secondes donné",
	commandTestShouldReply: true,
	execute: blockPlayerTestCommand
};