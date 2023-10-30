import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "@Core/src/core/fights/actions/FightActionController";
import {getUsedGodMoves} from "./divineAttack";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {defaultFailFightActionResult, FightActionResult, FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";

function getAttackInfo(): attackInfo {
	return {
		minDamage: 55,
		averageDamage: 100,
		maxDamage: 200
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
	// Check the amount of ultimate attacks the sender already used
	// 1 god move per fight
	if (getUsedGodMoves(sender, receiver) >= 1) {
		return defaultFailFightActionResult();
	}

	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 5,
			failure: 10
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);

	const buff = (1 + (turn < 15 ? Math.round(1.67 * turn) : 25)) / 100;

	for (const statBuffed of [FightStatBuffed.ATTACK, FightStatBuffed.DEFENSE, FightStatBuffed.SPEED]) {
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: statBuffed,
			operator: FightStatModifierOperation.ADDITION,
			value: buff
		}, sender, fightAction);
	}

	return result;
};

export default use;