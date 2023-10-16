import {IMission} from "../IMission";
import Player from "../../database/game/models/Player";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(): boolean {
		return true;
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	initialNumberDone(player: Player): Promise<number> {
		return Promise.resolve(player.petId ? 1 : 0);
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};