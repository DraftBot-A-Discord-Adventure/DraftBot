import {IMission} from "../IMission";
import Player from "../../models/Player";

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

	initialNumberDone(player: Player): Promise<number> {
		return Promise.resolve(player.score);
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};