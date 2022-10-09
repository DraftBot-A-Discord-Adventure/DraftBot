import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {InventoryInfos} from "../../../../core/database/game/models/InventoryInfo";

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
	execute: null // defined later
};

/**
 * Quick travel your daily of a given time
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const advancePlayerDailyTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const inventoryInfo = await InventoryInfos.getOfPlayer(player.id);
	inventoryInfo.lastDailyAt = new Date(inventoryInfo.lastDailyAt.valueOf() - parseInt(args[0], 10) * 60000);
	await inventoryInfo.save();
	return format(commandInfo.messageWhenExecuted, {time: args[0]});
};

commandInfo.execute = advancePlayerDailyTestCommand;
