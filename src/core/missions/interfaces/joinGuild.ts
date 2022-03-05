import {IMission} from "../IMission";
import Player from "../../models/Player";

export const missionInterface: IMission = {
	generateRandomVariant: () => Promise.resolve(0),

	areParamsMatchingVariantAndSave: () => true,

	getVariantFormatVariable: () => Promise.resolve(""),

	initialNumberDone: (player: Player) => Promise.resolve(player.guildId ? 1 : 0),

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};