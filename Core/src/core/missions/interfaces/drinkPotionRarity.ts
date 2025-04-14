import { IMission } from "../IMission";

export const missionInterface: IMission = {
	generateRandomVariant: () => 0,

	areParamsMatchingVariantAndBlob: (variant, params) => (params.rarity as number) >= variant,

	initialNumberDone: () => 0,

	updateSaveBlob: () => null
};
