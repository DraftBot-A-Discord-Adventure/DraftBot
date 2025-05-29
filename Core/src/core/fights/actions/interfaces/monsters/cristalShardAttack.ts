import { Fighter } from "../../../fighter/Fighter";
import {
	attackInfo, FightActionController, statsInfo
} from "../../FightActionController";
import { FightActionFunc } from "../../../../../data/FightAction";
import { FightActionResult } from "../../../../../../../Lib/src/types/FightActionResult";

const use: FightActionFunc = (sender, receiver) => {
	const initialDamage = FightActionController.getAttackDamage(getStatsInfo(sender, receiver), sender, getAttackInfo());
	const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 20, 2);

	const result: FightActionResult = {
		attackStatus: damageDealt.status,
		damages: damageDealt.damages
	};

	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 10,
		averageDamage: 70,
		maxDamage: 170
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [sender.getAttack()],
		defenderStats: [receiver.getSpeed() * 5],
		statsEffect: [1]
	};
}
