import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "blockplayer",
	aliases: ["block"],
	commandFormat: "<time>",
	typeWaited: {
		time: TypeKey.INTEGER
	},
	description: "Vous bloque pendant un temps en secondes donné"
};

/**
 * Block your player for a given time
 */
const blockPlayerTestCommand: ExecuteTestCommandLike = () => // TODO : Check if this test command is still relevant
	/* Const blockTime = parseInt(args[0], 10);
	if (blockTime <= 0) {
		throw new Error("Erreur block : on ne peut pas vous bloquer pendant un temps négatif ou nul !");
	}
	const messageToReact = <Message> await interaction.reply({
		content: "je suis un message qui va te bloquer",
		fetchReply: true
	});
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
	BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.TEST, collector); */
	`Vous êtes maintenant bloqué pendant ${1} secondes !`
;

commandInfo.execute = blockPlayerTestCommand;