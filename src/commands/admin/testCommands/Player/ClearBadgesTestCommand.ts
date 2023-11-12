import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {DraftbotInteraction} from "../../../../core/messages/DraftbotInteraction";

export const commandInfo: ITestCommand = {
	name: "clearbadges",
	commandFormat: "",
	messageWhenExecuted: "Vous avez supprimé vos badges !",
	description: "Supprime les badges de votre joueur",
	commandTestShouldReply: true,
	execute: null // Defined later
};

/**
 * Delete all badges of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const clearBadgesTestCommand = async (language: string, interaction: DraftbotInteraction): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	player.badges = null;
	await player.save();

	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = clearBadgesTestCommand;