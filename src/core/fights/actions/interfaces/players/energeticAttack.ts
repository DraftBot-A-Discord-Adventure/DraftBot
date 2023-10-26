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
		{critical: 35, failure: 5},
		{attackInfo: getAttackInfo(), statsInfo: getStatsInfo(sender, receiver)}
	);

	FightActionController.applyBuff(result, {
		selfTarget: true,
		stat: FightStatBuffed.ENERGY,
		operator: FightStatModifierOperation.ADDITION,
		value: Math.round(result.damages / 2)
	}, sender, fightAction);

	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {minDamage: 30, averageDamage: 75, maxDamage: 115};
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
			0.75,
			0.25
		]
	};
}