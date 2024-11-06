import {IMission} from "../IMission";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave: (variant, params) => (params.remainingPercent as number) <= variant / 100.0,

	generateRandomVariant: () => 0,

	initialNumberDone: () => 0,

	updateSaveBlob: () => null
};
