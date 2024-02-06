import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightActionController, statsInfo} from "../../FightActionController";
import {RandomUtils} from "../../../../utils/RandomUtils";
import {FightActionFunc} from "../../../../../data/FightAction";
import {FightStatBuffed} from "../../../../../../../Lib/src/interfaces/FightActionResult";
import {FightStatModifierOperation} from "../../../../../../../Lib/src/interfaces/FightStatModifierOperation";
import {simpleDamageFightAction} from "../../templates/SimpleDamageFightActionTemplate";

function getAttackInfo(): attackInfo {
	return {
		minDamage: 30,
		averageDamage: 60,
		maxDamage: 100
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

const use: FightActionFunc = (sender, receiver, fightAction) => {
	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 1,
			failure: 10
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);

	// 60% chance of reducing the opponent's speed by 20%. Otherwise, steal 1 point of breath from the opponent.
	if (RandomUtils.draftbotRandom.bool(0.4) || receiver.getBreath() < 1) {
		// Reduce target speed by 20%
		FightActionController.applyBuff(result, {
			selfTarget: false,
			stat: FightStatBuffed.SPEED,
			operator: FightStatModifierOperation.MULTIPLIER,
			value: 0.8
		}, receiver, fightAction);
	}
	else {
		FightActionController.applyBuff(result, {
			selfTarget: false,
			stat: FightStatBuffed.BREATH,
			operator: FightStatModifierOperation.ADDITION,
			value: -1
		}, receiver, fightAction);
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: FightStatBuffed.BREATH,
			operator: FightStatModifierOperation.ADDITION,
			value: 1
		}, receiver, fightAction);
	}
	return result;
};

export default use;