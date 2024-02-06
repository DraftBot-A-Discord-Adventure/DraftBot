import {IMission} from "../IMission";

export const missionInterface: IMission = {
	generateRandomVariant: () => Promise.resolve(0),

	areParamsMatchingVariantAndSave: (variant: number, params: { [key: string]: unknown }) => (params.rarity as number) >= variant,

	initialNumberDone: () => Promise.resolve(0),

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};