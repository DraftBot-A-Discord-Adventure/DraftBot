import {IMission} from "./IMission";

export const missionInterface: IMission = {
	areParamsMatchingVariant(): boolean {
		return true;
	},

	getVariantFormatVariable(): string {
		return "";
	},

	generateRandomVariant(): number {
		return 0;
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	}
};