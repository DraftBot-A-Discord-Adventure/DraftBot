import {IMission} from "../IMission";
import {FightActionController} from "../../fights/actions/FightActionController";
import {RandomUtils} from "../../utils/RandomUtils";
import {ClassDataController} from "../../../data/Class";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: unknown }): boolean {
		return params.lastAttack === FightActionController.variantToFightActionId(variant);
	},

	async generateRandomVariant(difficulty, player): Promise<number> {
		return FightActionController.fightActionIdToVariant(RandomUtils.draftbotRandom.pick((ClassDataController.instance.getById(player.class)).fightActionsIds));
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};