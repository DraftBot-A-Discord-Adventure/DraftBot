import {Constants} from "../../../../core/Constants";
import {format} from "../../../../core/utils/StringFormatter";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import InventoryInfo, {InventoryInfos} from "../../../../core/database/game/models/InventoryInfo";

export const commandInfo: ITestCommand = {
	name: "slots",
	commandFormat: "<category [0-3]> <number>",
	typeWaited: {
		"category [0-3]": Constants.TEST_VAR_TYPES.INTEGER,
		number: Constants.TEST_VAR_TYPES.INTEGER
	},
	messageWhenExecuted: "Vous avez désormais {slot} emplacements pour les {category} !",
	description: "Change le nombre d'emplacements disponibles pour les armes",
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
const slotsTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	const slots = parseInt(args[1], 10);
	if (slots >= 5 || slots < 0) {
		throw Error("Argument slots invalide. Doit être compris entre 0 et 5");
	}
	let category;
	const inventoryInfo = await InventoryInfos.getOfPlayer(player.id);

	switch (parseInt(args[0], 10)) {
	case Constants.ITEM_CATEGORIES.WEAPON:
		inventoryInfo.weaponSlots = slots;
		category = "armes";
		break;
	case Constants.ITEM_CATEGORIES.ARMOR:
		inventoryInfo.armorSlots = slots;
		category = "armures";
		break;
	case Constants.ITEM_CATEGORIES.POTION:
		inventoryInfo.potionSlots = slots;
		category = "potions";
		break;
	case Constants.ITEM_CATEGORIES.OBJECT:
		inventoryInfo.objectSlots = slots;
		category = "objets";
		break;
	default:
		break;
	}

	await inventoryInfo.save();

	return format(commandInfo.messageWhenExecuted, {
		slot: slots,
		category
	});
};

commandInfo.execute = slotsTestCommand;