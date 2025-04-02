import { IMission } from "../IMission";

export const missionInterface: IMission = {
	generateRandomVariant: () => 0,

	areParamsMatchingVariantAndBlob: (_variant, params, saveBlob) => {
		if (!saveBlob) {
			return true;
		}
		return !saveBlob.toString().includes(`${params.metPlayerKeycloakId}`);
	},

	initialNumberDone: () => 0,

	updateSaveBlob: (_variant, saveBlob, params) => {
		if (!saveBlob) {
			return Buffer.from(`${params.metPlayerKeycloakId}`);
		}
		return Buffer.concat([saveBlob, Buffer.from(`,${params.metPlayerKeycloakId}`)]);
	}
};
