import {IMission} from "../IMission";
import Player from "../../database/game/models/Player";
import {ClassDataController} from "../../../data/Class";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: unknown }): boolean {
		return (params.tier as number) >= variant;
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	initialNumberDone(player: Player, variant: number): number {
		return ClassDataController.instance.getById(player.class).classGroup >= variant ? 1 : 0;
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};