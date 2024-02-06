import {IMission} from "../IMission";
import {MapLocationDataController} from "../../../data/MapLocation";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: unknown }): boolean {
		return variant === params.mapId;
	},

	generateRandomVariant(): number {
		return MapLocationDataController.instance.getRandomGotoableMap().id;
	},

	initialNumberDone(): number {
		return 0;
	},

	updateSaveBlob(): Buffer {
		return null;
	}
};