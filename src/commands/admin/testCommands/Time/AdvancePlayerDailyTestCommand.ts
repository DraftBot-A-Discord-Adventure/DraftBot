import {Entities} from "../../../../core/database/game/models/Entity";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Quick travel your daily of a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const advancePlayerDailyTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	entity.Player.InventoryInfo.lastDailyAt = new Date(entity.Player.InventoryInfo.lastDailyAt.valueOf() - parseInt(args[0], 10) * 60000);
	await entity.Player.InventoryInfo.save();
	return format(commandInfo.messageWhenExecuted, {time: args[0]});
};

export const commandInfo: ITestCommand = {
	name: "advanceplayerdaily",
	aliases: ["adaily"],
	commandFormat: "<time>",
	typeWaited: {
		time: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez avancé votre daily de {time} minutes !",
	description: "Avance le daily de votre joueur d'une durée en minutes donnée",
	commandTestShouldReply: true,
	execute: advancePlayerDailyTestCommand
};