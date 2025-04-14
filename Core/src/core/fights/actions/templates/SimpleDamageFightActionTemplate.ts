import { Fighter } from "../../fighter/Fighter";
import {
	attackInfo, FightActionController, statsInfo
} from "../FightActionController";
import {
	FightActionResult, FightStatBuffed
} from "../../../../../../Lib/src/types/FightActionResult";
import { FightStatModifierOperation } from "../../../../../../Lib/src/types/FightStatModifierOperation";

export function simpleDamageFightAction(
	fighters: {
		sender: Fighter;
		receiver: Fighter;
	},
	probabilities: {
		critical: number;
		failure: number;
	},
	info: {
		attackInfo: attackInfo;
		statsInfo: statsInfo;
	},
	multiplier = 1
): FightActionResult {
	const initialDamage = FightActionController.getAttackDamage(info.statsInfo, fighters.sender, info.attackInfo) * multiplier;
	const attack = FightActionController.applySecondaryEffects(initialDamage, probabilities.critical, probabilities.failure);

	const result: FightActionResult = {
		attackStatus: attack.status,
		damages: attack.damages
	};
	if (multiplier !== 1) {
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: FightStatBuffed.SUMMON,
			value: multiplier,
			operator: FightStatModifierOperation.MULTIPLIER
		}, fighters.receiver, null);
	}
	return result;
}
