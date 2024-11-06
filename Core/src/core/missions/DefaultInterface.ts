import {IMission} from "./IMission";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave: () => true,

	generateRandomVariant: () => 0,

	initialNumberDone: () => 0,

	updateSaveBlob: () => null
};