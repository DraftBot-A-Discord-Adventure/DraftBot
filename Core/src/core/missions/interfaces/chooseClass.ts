import {IMission} from "../IMission";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave: () => true,

	generateRandomVariant: () => 0,

	initialNumberDone: (player) => (player.class !== 0 ? 1 : 0),

	updateSaveBlob: () => null
};