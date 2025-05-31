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
	// Check if the opponent has just made a physical attack
	const receiverLastAction = receiver.fightActionsHistory[receiver.fightActionsHistory.length - 1];
	if (!receiverLastAction || FightActionType.PHYSICAL !== receiverLastAction.type) {
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
			critical: 5,
			failure: 5
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
		minDamage: 35,
		averageDamage: 80,
		maxDamage: 220
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack(),
			sender.getDefense()
		],
		defenderStats: [
			receiver.getDefense(),
			receiver.getDefense()
		],
		statsEffect: [
			0.4,
			0.6
		]
	};
}

