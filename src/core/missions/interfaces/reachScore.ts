import {IMission} from "../IMission";
import Player from "../../models/Player";

export const missionInterface: IMission = {
	areParamsMatchingVariant(): boolean {
		return true;
	},

	getVariantFormatVariable(): Promise<string> {
		return Promise.resolve("");
	},

	generateRandomVariant(): number {
		return 0;
	},

	initialNumberDone(player: Player): Promise<number> {
		return Promise.resolve(player.score);
	}
};