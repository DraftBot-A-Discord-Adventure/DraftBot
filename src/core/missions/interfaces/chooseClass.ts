import {IMission} from "../IMission";
import Player from "../../models/Player";

export const missionInterface: IMission = {
	areParamsMatchingVariant(): boolean {
		return true;
	},

	getVariantFormatVariable(): string {
		return "";
	},

	generateRandomVariant(): number {
		return 0;
	},

	initialNumberDone(player: Player): Promise<number> {
		return Promise.resolve(player.class !== 0 ? 1 : 0);
	}
};