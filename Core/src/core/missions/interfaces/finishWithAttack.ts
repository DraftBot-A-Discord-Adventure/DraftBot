import {IMission} from "../IMission";
import {FightActionController} from "../../fights/actions/FightActionController";
import {RandomUtils} from "../../../../../Lib/src/utils/RandomUtils";
import {ClassDataController} from "../../../data/Class";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave: (variant, params) => params.lastAttack === FightActionController.variantToFightActionId(variant),

	generateRandomVariant: (difficulty, player) => FightActionController.fightActionIdToVariant(RandomUtils.draftbotRandom.pick(ClassDataController.instance.getById(player.class).fightActionsIds)),

	initialNumberDone: () => 0,

	updateSaveBlob: () => null
};