import {Entities} from "../../../../core/database/game/models/Entity";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Give a badge to your player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const giveBadgeTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	entity.Player.addBadge(args[0]);
	await entity.Player.save();

	return format(commandInfo.messageWhenExecuted, {badge: args[0]});
};

export const commandInfo: ITestCommand = {
	name: "givebadge",
	commandFormat: "<badge>",
	typeWaited: {
		badge: Constants.TEST_VAR_TYPES.EMOJI
	},
	messageWhenExecuted: "Vous avez maintenant le badge {badge} !",
	description: "Donne un badge à votre joueur",
	commandTestShouldReply: true,
	execute: giveBadgeTestCommand
};