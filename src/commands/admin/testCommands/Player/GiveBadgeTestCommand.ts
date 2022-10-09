import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "givebadge",
	commandFormat: "<badge>",
	typeWaited: {
		badge: Constants.TEST_VAR_TYPES.EMOJI
	},
	messageWhenExecuted: "Vous avez maintenant le badge {badge} !",
	description: "Donne un badge à votre joueur",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Give a badge to your player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const giveBadgeTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	player.addBadge(args[0]);
	await player.save();

	return format(commandInfo.messageWhenExecuted, {badge: args[0]});
};

commandInfo.execute = giveBadgeTestCommand;
