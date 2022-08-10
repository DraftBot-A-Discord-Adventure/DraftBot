import {IMission} from "../IMission";
import Player from "../../database/game/models/Player";
import {Classes} from "../../database/game/models/Class";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: any }): boolean {
		return params.tier >= variant;
	},

	getVariantFormatVariable(variant: number): Promise<string> {
		return Promise.resolve((variant + 1).toString());
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	async initialNumberDone(player: Player, variant: number): Promise<number> {
		return (await Classes.getById(player.class)).classGroup >= variant ? 1 : 0;
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};