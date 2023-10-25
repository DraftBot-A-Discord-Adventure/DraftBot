import {attackInfo, statsInfo} from "../FightAction";
import {Fighter} from "../../fighter/Fighter";
import {FightActionController} from "../FightActionController";
import {FightActionResult} from "@Lib/src/interfaces/FightActionResult";

export function simpleDamageFightAction(
	fighters: {
		sender: Fighter,
		receiver: Fighter
	},
	probabilities: {
		critical: number,
		failure: number
	},
	info: {
		attackInfo: attackInfo,
		statsInfo: statsInfo
	}): FightActionResult {

	const initialDamage = FightActionController.getAttackDamage(info.statsInfo, fighters.sender, info.attackInfo);
	const attack = FightActionController.applySecondaryEffects(initialDamage, probabilities.critical, probabilities.failure);
	fighters.receiver.damage(attack.damages);

	return {
		attackStatus: attack.status,
		damages: attack.damages
	}
}
