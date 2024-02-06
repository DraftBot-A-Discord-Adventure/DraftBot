import * as ItemUtils from "../../../../core/utils/ItemUtils";
import {getItemByIdAndCategory} from "../../../../core/utils/ItemUtils";
import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";
import {InventorySlots} from "../../../../core/database/game/models/InventorySlot";

export const commandInfo: ITestCommand = {
	name: "finditem",
	commandFormat: "<category [0-3]> <item id>",
	typeWaited: {
		"category [0-3]": TypeKey.INTEGER,
		"item id": TypeKey.INTEGER
	},
	description: "Permet de trouver un objet défini"
};

/**
 * Set the weapon of the player
 */
const findItemTestCommand: ExecuteTestCommandLike = async (player, args, response) => {
	const category = parseInt(args[0], 10);
	const itemId = parseInt(args[1], 10);
	if (category < 0 || category > 3) {
		throw Error("Catégorie inconnue. Elle doit être en 0 et 3");
	}
	const item = getItemByIdAndCategory(itemId, category);
	if (!item) {
		throw Error("Aucun objet n'existe dans cette catégorie avec cet id");
	}
	// TODO : replace context with the right one
	ItemUtils.giveItemToPlayer(player, item, response[0], response, await InventorySlots.getOfPlayer(player.id)).finally(() => null);
	return `Vous avez trouvé l'objet d'id ${itemId} de la catégorie n°${category}.`;
};

commandInfo.execute = findItemTestCommand;