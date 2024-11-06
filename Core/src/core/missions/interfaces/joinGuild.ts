import {IMission} from "../IMission";

export const missionInterface: IMission = {
	generateRandomVariant: () => 0,

	areParamsMatchingVariantAndSave: () => true,

	initialNumberDone: (player) => (player.guildId ? 1 : 0),

	updateSaveBlob: () => null
};