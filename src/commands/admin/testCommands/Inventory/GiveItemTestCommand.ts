import {Constants} from "../../../../core/Constants";
import {Armors} from "../../../../core/database/game/models/Armor";
import {Weapons} from "../../../../core/database/game/models/Weapon";
import {Potions} from "../../../../core/database/game/models/Potion";
import {ObjectItems} from "../../../../core/database/game/models/ObjectItem";
import {Entities} from "../../../../core/database/game/models/Entity";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {GenericItemModel} from "../../../../core/database/game/models/GenericItemModel";
import {ITestCommand} from "../../../../core/CommandsTest";

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
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const itemId = parseInt(args[1], 10);
	const category = parseInt(args[0], 10);
	if (category < 0 || category > 3) {
		throw Error("Catégorie inconnue. Elle doit être en 0 et 3");
	}
	let item: GenericItemModel;
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
	if (!item) {
		throw Error("Aucun objet n'existe dans cette catégorie avec cet id");
	}
	if (!await entity.Player.giveItem(item)) {
		throw Error("Aucun emplacement libre dans l'inventaire");
	}

	return format(commandInfo.messageWhenExecuted, {
		item: item.toString(language, null)
	});
};

commandInfo.execute = giveItemTestCommand;