import { IMission } from "../IMission";

export const missionInterface: IMission = {
	generateRandomVariant: () => 0,

	areParamsMatchingVariantAndBlob: (variant, params) => (params.itemCost as number) >= variant,

	initialNumberDone: () => 0,

	updateSaveBlob: () => null
};
