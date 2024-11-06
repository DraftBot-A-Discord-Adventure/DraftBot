import {IMission} from "../IMission";
import {countNbOfPotions} from "../../utils/ItemUtils";
import {InventorySlots} from "../../database/game/models/InventorySlot";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave: () => true,

	generateRandomVariant: () => 0,

	initialNumberDone: async (player) => countNbOfPotions(await InventorySlots.getOfPlayer(player.id)),

	updateSaveBlob: () => null
};