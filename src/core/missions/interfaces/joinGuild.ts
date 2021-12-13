import {IMission} from "../IMission";
import Player from "../../models/Player";

export const missionInterface: IMission = {
	generateRandomVariant: () => 0,

	areParamsMatchingVariant: () => true,

	getVariantFormatVariable: () => "",

	initialNumberDone: (player: Player) => Promise.resolve(player.guildId ? 1 : 0)
};