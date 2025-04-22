import { IMission } from "../IMission";
import { MapLocationDataController } from "../../../data/MapLocation";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndBlob: (variant, params) => variant === params.mapId,

	generateRandomVariant: () => MapLocationDataController.instance.getRandomGotoableMap().id,

	initialNumberDone: () => 0,

	updateSaveBlob: () => null
};
