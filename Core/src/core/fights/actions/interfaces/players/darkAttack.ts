import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightActionController, statsInfo} from "../../FightActionController";
import {RandomUtils} from "../../../../../../../Lib/src/utils/RandomUtils";
import {FightActionFunc} from "../../../../../data/FightAction";
import {FightStatBuffed} from "../../../../../../../Lib/src/types/FightActionResult";
import {FightStatModifierOperation} from "../../../../../../../Lib/src/types/FightStatModifierOperation";
import {simpleDamageFightAction} from "../../templates/SimpleDamageFightActionTemplate";

const use: FightActionFunc = (sender, receiver, fightAction) => {
	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 35,
			failure: 8
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);

	if (RandomUtils.draftbotRandom.bool(0.65)) {
		FightActionController.applyBuff(result, {
			selfTarget: false,
			stat: FightStatBuffed.ATTACK,
			operator: FightStatModifierOperation.MULTIPLIER,
			value: 0.95
		}, receiver, fightAction);
	}

	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 30,
		averageDamage: 50,
		maxDamage: 110
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack(),
			receiver.getAttack()
		],
		defenderStats: [
			0,
			0
		],
		statsEffect: [
			0.5,
			0.5
		]
	};
}