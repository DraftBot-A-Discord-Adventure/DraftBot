import {Entities} from "../../../../core/database/game/models/Entity";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Add gems to the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const addGemsTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	await entity.Player.PlayerMissionsInfo.addGems(parseInt(args[0], 10), entity, NumberChangeReason.TEST);
	await entity.Player.PlayerMissionsInfo.save();

	return format(commandInfo.messageWhenExecuted, {gem: entity.Player.PlayerMissionsInfo.gems});
};

export const commandInfo: ITestCommand = {
	name: "addgem",
	commandFormat: "<gem>",
	typeWaited: {
		gem: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez maintenant {gem} :gem: !",
	description: "Ajoute la valeur donnée de gemmes à votre joueur",
	commandTestShouldReply: true,
	execute: addGemsTestCommand
};