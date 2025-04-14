import { IMission } from "../IMission";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndBlob: (variant, params) => (params.remainingPercent as number) <= variant / 100.0,

	generateRandomVariant: () => 0,

	initialNumberDone: () => 0,

	updateSaveBlob: () => null
};
