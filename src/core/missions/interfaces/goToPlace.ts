import {IMission} from "../IMission";
import {MapLocations} from "../../models/MapLocation";

export const missionInterface: IMission = {
	areParamsMatchingVariant(variant: number, params: { [key: string]: any }): boolean {
		return variant === params.mapId;
	},

	async getVariantFormatVariable(variant: number, objective: number, language: string): Promise<string> {
		return (await MapLocations.getById(variant)).getDisplayName(language);
	},

	generateRandomVariant(): number {
		return 0; // We don't need this as it is campaign only
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	}
};