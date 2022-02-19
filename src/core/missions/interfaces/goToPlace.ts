import {IMission} from "../IMission";
import {MapLocations} from "../../models/MapLocation";

export const missionInterface: IMission = {
	areParamsMatchingVariant(variant: number, params: { [key: string]: any }): boolean {
		return variant === params.mapId;
	},

	async getVariantFormatVariable(variant: number, objective: number, language: string): Promise<string> {
		const map = await MapLocations.getById(variant);
		return await map.getDeterminant(language) + " " + map.getDisplayName(language);
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	}
};