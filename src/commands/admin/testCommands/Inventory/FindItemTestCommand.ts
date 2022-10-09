import {Constants} from "../../../../core/Constants";
import * as ItemUtils from "../../../../core/utils/ItemUtils";
import {getItemByIdAndCategory} from "../../../../core/utils/ItemUtils";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "finditem",
	commandFormat: "<category [0-3]> <item id>",
	typeWaited: {
		"category [0-3]": Constants.TEST_VAR_TYPES.INTEGER,
		"item id": Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "",
	description: "Permet de trouver un objet défini",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set the weapon of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const findItemTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const category = parseInt(args[0], 10);
	const itemId = parseInt(args[1], 10);
	if (category < 0 || category > 3) {
		throw Error("Catégorie inconnue. Elle doit être en 0 et 3");
	}
	const item = await getItemByIdAndCategory(itemId, category);
	if (!item) {
		throw Error("Aucun objet n'existe dans cette catégorie avec cet id");
	}
	ItemUtils.giveItemToPlayer(player, item, language, interaction.user, interaction.channel).finally(() => null);
	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = findItemTestCommand;