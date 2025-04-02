import { Fighter } from "../../../fighter/Fighter";
import {
	attackInfo, FightActionController, statsInfo
} from "../../FightActionController";
import { FightAlterations } from "../../FightAlterations";
import { FightActionFunc } from "../../../../../data/FightAction";
import { simpleDamageFightAction } from "../../templates/SimpleDamageFightActionTemplate";

const use: FightActionFunc = (sender, receiver) => {
	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 70,
			failure: 0
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);
	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterations.DIRTY
	}, receiver);
	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 30,
		averageDamage: 60,
		maxDamage: 120
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [sender.getAttack()], defenderStats: [receiver.getDefense()], statsEffect: [1]
	};
}
