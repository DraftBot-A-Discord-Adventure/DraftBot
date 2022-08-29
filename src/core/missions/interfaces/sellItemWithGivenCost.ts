import {IMission} from "../IMission";

export const missionInterface: IMission = {
	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	areParamsMatchingVariantAndSave: (variant: number, params: { [key: string]: unknown }) => params.itemCost >= variant,

	getVariantFormatVariable: (variant: number) => Promise.resolve(variant.toString()),

	initialNumberDone: () => Promise.resolve(0),

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};