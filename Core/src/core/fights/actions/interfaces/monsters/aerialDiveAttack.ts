import { Fighter } from "../../../fighter/Fighter";
import {
	attackInfo, statsInfo
} from "../../FightActionController";
import { FightActionFunc } from "../../../../../data/FightAction";
import { simpleDamageFightAction } from "../../templates/SimpleDamageFightActionTemplate";
import {
	customMessageActionResult
} from "../../../../../../../Lib/src/types/FightActionResult";
import { FightActionType } from "../../../../../../../Lib/src/types/FightActionType";

const use: FightActionFunc = (sender, receiver) => {
	// Check if the opponent has just made a ranged attack
	const receiverLastAction = receiver.fightActionsHistory[receiver.fightActionsHistory.length - 1];
	if (!receiverLastAction || FightActionType.DISTANCE === receiverLastAction.type) {
		return {
			...customMessageActionResult(),
			damages: 0
		};
	}

	return simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 20,
			failure: 15
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 70,
		averageDamage: 180,
		maxDamage: 250
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getSpeed(),
			sender.getAttack()
		],
		defenderStats: [
			receiver.getSpeed(),
			receiver.getDefense()
		],
		statsEffect: [
			0.6,
			0.4
		]
	};
}
