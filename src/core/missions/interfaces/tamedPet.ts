import {IMission} from "../IMission";
import Player from "../../database/game/models/Player";
import {PetEntities} from "../../database/game/models/PetEntity";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: unknown }): boolean {
		return params.loveLevel >= 4;
	},

	getVariantFormatVariable(): Promise<string> {
		return Promise.resolve("");
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	async initialNumberDone(player: Player): Promise<number> {
		return player.petId ? (await PetEntities.getById(player.petId)).getLoveLevelNumber() >= 4 ? 1 : 0 : 0;
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};