import { FightActionFunc } from "../../../../../data/FightAction";
import { customMessageActionResult } from "../../../../../../../Lib/src/types/FightActionResult";
import { FightActionType } from "../../../../../../../Lib/src/types/FightActionType";
import { simpleDamageFightAction } from "../../templates/SimpleDamageFightActionTemplate";
import {
	attackInfo, statsInfo
} from "../../FightActionController";
import { Fighter } from "../../../fighter/Fighter";

const use: FightActionFunc = (sender, receiver) => {
	const lastAttack = receiver.getLastFightActionUsed();
	if (!lastAttack || [
		FightActionType.MAGIC,
		FightActionType.STATS,
		FightActionType.ALTERATION
	].includes(lastAttack.type)) {
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
			failure: 2
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
		minDamage: 80,
		averageDamage: 100,
		maxDamage: 160
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack(),
			sender.getSpeed()
		],
		defenderStats: [
			receiver.getDefense() / 2,
			receiver.getSpeed()
		],
		statsEffect: [
			0.9,
			0.1
		]
	};
}
