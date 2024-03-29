import {IMission} from "../IMission";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: unknown }): boolean {
		return (params.remainingPercent as number) <= variant / 100.0;
	},

	getVariantFormatVariable(variant: number): Promise<string> {
		return Promise.resolve(variant.toString());
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};
