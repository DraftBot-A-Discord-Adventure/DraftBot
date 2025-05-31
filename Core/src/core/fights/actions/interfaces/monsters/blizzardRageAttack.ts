import { Fighter } from "../../../fighter/Fighter";
import {
	attackInfo, FightActionController, statsInfo
} from "../../FightActionController";
import { FightAlterations } from "../../FightAlterations";
import { FightActionFunc } from "../../../../../data/FightAction";
import { simpleDamageFightAction } from "../../templates/SimpleDamageFightActionTemplate";
import {
	customMessageActionResult,
	FightStatBuffed
} from "../../../../../../../Lib/src/types/FightActionResult";
import { FightStatModifierOperation } from "../../../../../../../Lib/src/types/FightStatModifierOperation";

const use: FightActionFunc = (sender, receiver, fightAction) => {
	const count = sender.fightActionsHistory.filter(action => action.id === "blizzardRageAttack").length;

	if (count > 0) {
		return {
			...customMessageActionResult(),
			damages: 0
		};
	}

	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 15,
			failure: 0
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);

	if (Math.random() < 0.4) {
		FightActionController.applyAlteration(result, {
			selfTarget: false,
			alteration: FightAlterations.FROZEN
		}, receiver);
	}

	FightActionController.applyBuff(result, {
		selfTarget: false,
		stat: FightStatBuffed.SPEED,
		value: 0.7,
		operator: FightStatModifierOperation.MULTIPLIER
	}, receiver, fightAction);

	FightActionController.applyBuff(result, {
		selfTarget: false,
		stat: FightStatBuffed.DEFENSE,
		value: 0.8,
		operator: FightStatModifierOperation.MULTIPLIER
	}, receiver, fightAction);


	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 45,
		averageDamage: 95,
		maxDamage: 145
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
