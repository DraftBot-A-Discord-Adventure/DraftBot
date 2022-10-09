import {Constants} from "../../../../core/Constants";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {getItemByIdAndCategory} from "../../../../core/utils/ItemUtils";
import {Players} from "../../../../core/database/game/models/Player";

export const commandInfo: ITestCommand = {
	name: "giveitem",
	commandFormat: "<category [0-3]> <item id>",
	typeWaited: {
		"category [0-3]": Constants.TEST_VAR_TYPES.INTEGER,
		"item id": Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez reçu {item} !",
	description: "Permet de se donner un objet",
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
const giveItemTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const itemId = parseInt(args[1], 10);
	const category = parseInt(args[0], 10);
	if (category < 0 || category > 3) {
		throw Error("Catégorie inconnue. Elle doit être en 0 et 3");
	}
	const item = await getItemByIdAndCategory(itemId, category);
	if (!item) {
		throw Error("Aucun objet n'existe dans cette catégorie avec cet id");
	}
	if (!await player.giveItem(item)) {
		throw Error("Aucun emplacement libre dans l'inventaire");
	}
	return format(commandInfo.messageWhenExecuted, {
		item: item.toString(language, null)
	});
};

commandInfo.execute = giveItemTestCommand;