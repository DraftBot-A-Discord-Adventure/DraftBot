import {Constants} from "../../../../core/Constants";
import {Entities} from "../../../../core/database/game/models/Entity";

module.exports.commandInfo = {
	name: "slots",
	commandFormat: "<category [0-3]> <number>",
	typeWaited: {
		"category [0-3]": typeVariable.INTEGER,
		number: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez désormais {slot} emplacements pour les {category} !",
	description: "Change le nombre d'emplacements disponibles pour les armes",
	commandTestShouldReply: true
};

/**
 * Set the weapon of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const slotsTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const slots = parseInt(args[1], 10);
	if (slots >= 5 || slots < 0) {
		throw Error("Argument slots invalide. Doit être compris entre 0 et 5");
	}
	let category;

	switch (parseInt(args[0], 10)) {
	case Constants.ITEM_CATEGORIES.WEAPON:
		entity.Player.InventoryInfo.weaponSlots = slots;
		category = "armes";
		break;
	case Constants.ITEM_CATEGORIES.ARMOR:
		entity.Player.InventoryInfo.armorSlots = slots;
		category = "armures";
		break;
	case Constants.ITEM_CATEGORIES.POTION:
		entity.Player.InventoryInfo.potionSlots = slots;
		category = "potions";
		break;
	case Constants.ITEM_CATEGORIES.OBJECT:
		entity.Player.InventoryInfo.objectSlots = slots;
		category = "objets";
		break;
	default:
		break;
	}

	await entity.Player.InventoryInfo.save();

	return format(module.exports.commandInfo.messageWhenExecuted, {
		slot: slots,
		category
	});
};

module.exports.execute = slotsTestCommand;