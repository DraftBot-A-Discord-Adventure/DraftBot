import { Fighter } from "../../../fighter/Fighter";
import {
	attackInfo, FightActionController, statsInfo
} from "../../FightActionController";
import { FightAlterations } from "../../FightAlterations";
import { FightActionFunc } from "../../../../../data/FightAction";
import { FightStatBuffed } from "../../../../../../../Lib/src/types/FightActionResult";
import { FightStatModifierOperation } from "../../../../../../../Lib/src/types/FightStatModifierOperation";
import { simpleDamageFightAction } from "../../templates/SimpleDamageFightActionTemplate";

const use: FightActionFunc = (sender, receiver, fightAction) => {
	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 5,
			failure: 6
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);

	// 70% chance to stun the defender
	if (Math.random() < 0.70) {
		FightActionController.applyAlteration(result, {
			selfTarget: false,
			alteration: FightAlterations.STUNNED
		}, receiver);
	}

	// Sender has a 25% chance to be stunned and 75% chance to be hurt by his own attack
	if (Math.random() < 0.25) {
		FightActionController.applyAlteration(result, {
			selfTarget: true,
			alteration: FightAlterations.STUNNED
		}, sender);
	}
	else {
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: FightStatBuffed.DAMAGE,
			operator: FightStatModifierOperation.ADDITION,
			value: FightActionController.getAttackDamage({
				attackerStats: [
					sender.getDefense() * 0.55,
					sender.getSpeed() * 0.55
				],
				defenderStats: [
					sender.getDefense(),
					sender.getSpeed()
				],
				statsEffect: [
					0.85,
					0.15
				]
			}, sender, {
				minDamage: 60 * 0.55,
				averageDamage: 110 * 0.55,
				maxDamage: 210 * 0.55
			})
		}, sender, fightAction);
	}

	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 60,
		averageDamage: 110,
		maxDamage: 210
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getDefense(),
			sender.getSpeed()
		],
		defenderStats: [
			receiver.getDefense(),
			receiver.getSpeed()
		],
		statsEffect: [
			0.85,
			0.15
		]
	};
}
