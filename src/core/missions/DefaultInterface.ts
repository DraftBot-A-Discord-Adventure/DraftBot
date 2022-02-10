import {IMission} from "./IMission";

export const missionInterface: IMission = {
	areParamsMatchingVariant(): boolean {
		return true;
	},

	getVariantFormatVariable(): Promise<string> {
		return Promise.resolve("");
	},

	generateRandomVariant(): number {
		return 0;
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	}
};