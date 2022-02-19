import {IMission} from "../IMission";
import Player from "../../models/Player";

export const missionInterface: IMission = {
	areParamsMatchingVariant(variant: number, params: { [key: string]: any }): boolean {
		return params.loveLevel >= 4;
	},

	getVariantFormatVariable(): Promise<string> {
		return Promise.resolve("");
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	initialNumberDone(player: Player): Promise<number> {
		return Promise.resolve(player.Pet ? player.Pet.getLoveLevelNumber() >= 4 ? 1 : 0 : 0);
	}
};