import {Constants} from "../../../../core/Constants";
import * as ItemUtils from "../../../../core/utils/ItemUtils";
import {Armors} from "../../../../core/database/game/models/Armor";
import {Weapons} from "../../../../core/database/game/models/Weapon";
import {Potions} from "../../../../core/database/game/models/Potion";
import {ObjectItems} from "../../../../core/database/game/models/ObjectItem";
import {Entities} from "../../../../core/database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";

/**
 * Set the weapon of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const findItemTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const itemId = parseInt(args[1], 10);
	const category = parseInt(args[0], 10);
	if (category < 0 || category > 3) {
		throw Error("Catégorie inconnue. Elle doit être en 0 et 3");
	}
	let item = null;
	switch (category) {
	case Constants.ITEM_CATEGORIES.WEAPON:
		item = itemId <= await Weapons.getMaxId() && itemId > 0 ? await Weapons.getById(itemId) : null;
		break;
	case Constants.ITEM_CATEGORIES.ARMOR:
		item = itemId <= await Armors.getMaxId() && itemId > 0 ? await Armors.getById(itemId) : null;
		break;
	case Constants.ITEM_CATEGORIES.POTION:
		item = itemId <= await Potions.getMaxId() && itemId > 0 ? await Potions.getById(itemId) : null;
		break;
	case Constants.ITEM_CATEGORIES.OBJECT:
		item = itemId <= await ObjectItems.getMaxId() && itemId > 0 ? await ObjectItems.getById(itemId) : null;
		break;
	default:
		break;
	}
	if (item === null) {
		throw Error("Aucun objet n'existe dans cette catégorie avec cet id");
	}

	ItemUtils.giveItemToPlayer(entity, item, language, interaction.user, interaction.channel).finally(() => null);

	return commandInfo.messageWhenExecuted;
};

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
	execute: findItemTestCommand
};