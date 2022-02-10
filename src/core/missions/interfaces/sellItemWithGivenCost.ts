import {IMission} from "../IMission";

export const missionInterface: IMission = {
	generateRandomVariant(): number {
		return 0;
	},

	areParamsMatchingVariant: (variant: number, params: { [key: string]: any }) => params.itemCost >= variant,

	getVariantFormatVariable: (variant: number) => Promise.resolve(variant.toString()),

	initialNumberDone: () => Promise.resolve(0)
};