import {Entities} from "../../../../core/database/game/models/Entity";
import {BlockingUtils} from "../../../../core/utils/BlockingUtils";
import {BlockingConstants} from "../../../../core/constants/BlockingConstants";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction, Message} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Block your player for a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const blockPlayerTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const blockTime = parseInt(args[0], 10);
	if (blockTime <= 0) {
		throw new Error("Erreur block : on ne peut pas vous bloquer pendant un temps négatif ou nul !");
	}
	const messageToReact = <Message> await interaction.reply({content: "je suis un message qui va te bloquer", fetchReply: true});
	const collector = messageToReact.createReactionCollector({
		filter: () => true,
		time: blockTime * 1000
	});
	collector.on("collect", () => {
		// Do nothing
	});
	collector.on("end", () => {
		// Do nothing
	});
	BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.TEST, collector);
	return format(commandInfo.messageWhenExecuted, {time: blockTime});
};

export const commandInfo: ITestCommand = {
	name: "blockplayer",
	aliases: ["block"],
	commandFormat: "<time>",
	typeWaited: {
		time: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous êtes maintenant bloqué pendant {time} secondes !",
	description: "Vous bloque pendant un temps en secondes donné",
	commandTestShouldReply: true,
	execute: blockPlayerTestCommand
};