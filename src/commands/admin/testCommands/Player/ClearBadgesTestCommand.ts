import {Entities} from "../../../../core/database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Delete all badges of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const clearBadgesTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	entity.Player.badges = null;
	await entity.Player.save();

	return commandInfo.messageWhenExecuted;
};

export const commandInfo: ITestCommand = {
	name: "clearbadges",
	commandFormat: "",
	messageWhenExecuted: "Vous avez supprimé vos badges !",
	description: "Supprime les badges de votre joueur",
	commandTestShouldReply: true,
	execute: clearBadgesTestCommand
};