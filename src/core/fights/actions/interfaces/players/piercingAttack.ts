import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";

const use: FightActionFunc = (_fight, fightAction, sender, receiver) => {
	const result = simpleDamageFightAction(
		{sender, receiver},
		{critical: 5, failure: 10},
		{attackInfo: getAttackInfo(), statsInfo: getStatsInfo(sender, receiver)}
	);
	// 45% chance to lower the target's defense by 10%
	if (Math.random() < 0.45) {
		FightActionController.applyBuff(result, {
			selfTarget: false,
			stat: FightStatBuffed.DEFENSE,
			operator: FightStatModifierOperation.MULTIPLIER,
			value: 0.9
		}, receiver, fightAction);
	}
	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {minDamage: 20, averageDamage: 80, maxDamage: 150};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack(),
			sender.getSpeed()
		], defenderStats: [
			receiver.getDefense() * 0.2,
			receiver.getSpeed()
		], statsEffect: [
			0.8,
			0.2
		]
	};
}
