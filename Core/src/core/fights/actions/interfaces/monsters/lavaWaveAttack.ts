import { Fighter } from "../../../fighter/Fighter";
import { FightAlterations } from "../../FightAlterations";
import { simpleDamageFightAction } from "../../templates/SimpleDamageFightActionTemplate";
import { FightActionFunc } from "../../../../../data/FightAction";
import {
	attackInfo, FightActionController, statsInfo
} from "../../FightActionController";

const use: FightActionFunc = (sender, receiver) => {
	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 0,
			failure: 5
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);

	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterations.BURNED
	}, receiver);
	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 100,
		averageDamage: 210,
		maxDamage: 280
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [sender.getAttack()],
		defenderStats: [receiver.getDefense()],
		statsEffect: [1]
	};
}
