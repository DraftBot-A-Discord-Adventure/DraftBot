import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightActionController, statsInfo} from "../../FightActionController";
import {FightActionFunc} from "../../../../../data/FightAction";
import {
	defaultMaxUsesFightActionResult,
	FightActionResult,
	FightStatBuffed
} from "../../../../../../../Lib/src/types/FightActionResult";
import {FightStatModifierOperation} from "../../../../../../../Lib/src/types/FightStatModifierOperation";
import {simpleDamageFightAction} from "../../templates/SimpleDamageFightActionTemplate";
import {getUsedGodMoves} from "../../../FightController";

function getAttackInfo(): attackInfo {
	return {
		minDamage: 55,
		averageDamage: 170,
		maxDamage: 300
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack(),
			sender.getSpeed()
		],
		defenderStats: [
			receiver.getDefense(),
			receiver.getSpeed()
		],
		statsEffect: [
			0.7,
			0.3
		]
	};
}

const use: FightActionFunc = (sender, receiver, fightAction, turn): FightActionResult => {
	// Check the number of ultimate attacks the sender already used
	// 1 god move per fight
	if (getUsedGodMoves(sender, receiver) >= 1) {
		return defaultMaxUsesFightActionResult();
	}

	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 5,
			failure: 1
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);

	const buff = 1 + (turn < 15 ? Math.round(1.67 * turn) : 25) / 100 ;

	for (const statBuffed of [FightStatBuffed.ATTACK, FightStatBuffed.DEFENSE, FightStatBuffed.SPEED]) {
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: statBuffed,
			operator: FightStatModifierOperation.MULTIPLIER,
			value: buff
		}, sender, fightAction);
	}

	return result;
};

export default use;