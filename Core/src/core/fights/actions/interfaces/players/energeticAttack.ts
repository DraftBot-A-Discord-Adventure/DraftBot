import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightActionController, statsInfo} from "../../FightActionController";
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
			failure: 5
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
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
	return {
		minDamage: 30,
		averageDamage: 75,
		maxDamage: 115
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack(),
			sender.getSpeed()
		],
		defenderStats: [
			receiver.getDefense() * 0.2,
			receiver.getSpeed()
		],
		statsEffect: [
			0.75,
			0.25
		]
	};
}