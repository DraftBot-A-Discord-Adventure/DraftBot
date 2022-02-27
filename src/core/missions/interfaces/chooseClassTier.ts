import {IMission} from "../IMission";
import Player from "../../models/Player";
import {Classes} from "../../models/Class";

export const missionInterface: IMission = {
	areParamsMatchingVariant(variant: number, params: { [key: string]: any }): boolean {
		return params.tier >= variant;
	},

	getVariantFormatVariable(variant: number): Promise<string> {
		return Promise.resolve((variant + 1).toString());
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	async initialNumberDone(player: Player, variant: number): Promise<number> {
		return (await Classes.getById(player.class)).classgroup >= variant ? 1 : 0;
	}
};