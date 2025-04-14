import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "clearbadges",
	description: "Supprime les badges de votre joueur"
};

/**
 * Delete all badges of the player
 */
const clearBadgesTestCommand: ExecuteTestCommandLike = async player => {
	player.badges = null;
	await player.save();
	return "Vous avez supprimé vos badges !";
};

commandInfo.execute = clearBadgesTestCommand;
