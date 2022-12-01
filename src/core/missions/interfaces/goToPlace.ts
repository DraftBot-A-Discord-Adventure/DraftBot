import {IMission} from "../IMission";
import {MapLocations} from "../../database/game/models/MapLocation";
import {Language} from "../../constants/TypeConstants";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: unknown }): boolean {
		return variant === params.mapId;
	},

	async getVariantFormatVariable(variant: number, objective: number, language: Language): Promise<string> {
		const map = await MapLocations.getById(variant);
		return await map.getFullName(language);
	},

	async generateRandomVariant(): Promise<number> {
		return Promise.resolve((await MapLocations.getRandomGotoableMap()).id);
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};