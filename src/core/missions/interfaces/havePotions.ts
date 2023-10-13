import {IMission} from "../IMission";
import Player from "../../database/game/models/Player";
import {countNbOfPotions} from "../../utils/ItemUtils";
import {InventorySlots} from "../../database/game/models/InventorySlot";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(): boolean {
		return true;
	},

	getVariantFormatVariable(): Promise<string> {
		return Promise.resolve("");
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	async initialNumberDone(player: Player): Promise<number> {
		return countNbOfPotions(await InventorySlots.getOfPlayer(player.id));
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};