import { IMission } from "../IMission";
import { Guilds } from "../../database/game/models/Guild";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndBlob: () => true,

	generateRandomVariant: () => 0,

	initialNumberDone: async player => {
		const guild = await Guilds.getById(player.guildId);
		return guild?.level ?? 0;
	},

	updateSaveBlob: () => null
};
