import {IMission} from "../IMission";

export const missionInterface: IMission = {
	areParamsMatchingVariant(): boolean {
		return false;
	},

	getVariantFormatVariable(): string {
		return "";
	},

	generateRandomVariant(): number {
		return 0;
	}
};