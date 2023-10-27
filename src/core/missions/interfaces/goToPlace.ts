import {IMission} from "../IMission";
import {MapLocationDataController} from "../../../data/MapLocation";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: unknown }): boolean {
		return variant === params.mapId;
	},

	async generateRandomVariant(): Promise<number> {
		return Promise.resolve(MapLocationDataController.instance.getRandomGotoableMap().id);
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};