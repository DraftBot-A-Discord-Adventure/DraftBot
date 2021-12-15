import {IMission} from "../IMission";
import Player from "../../models/Player";

export const missionInterface: IMission = {
	generateRandomVariant: () => 0,

	areParamsMatchingVariant: () => true,

	getVariantFormatVariable: () => Promise.resolve(""),

	initialNumberDone: (player: Player) => Promise.resolve(player.guildId ? 1 : 0)
};