import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightActionController, statsInfo} from "../../FightActionController";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {defaultFightActionResult, FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";

const use: FightActionFunc = (sender, _receiver, fightAction) => {
	const count = sender.fightActionsHistory.filter(action => action.id === "resting").length;

	sender.nextFightAction = null;

	// Recovered fight points are reduced after the fourth use of this action
	const recoveredFightPoints = Math.round(FightActionController.getAttackDamage(getStatsInfo(sender), sender, getAttackInfo(), true) / (count < 4 ? 1 : 4));

	const result = defaultFightActionResult();
	FightActionController.applyBuff(result, {
		selfTarget: true,
		stat: FightStatBuffed.ENERGY,
		operator: FightStatModifierOperation.ADDITION,
		value: recoveredFightPoints
	}, sender, fightAction);
	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 15,
		averageDamage: 60,
		maxDamage: 110
	};
}

function getStatsInfo(sender: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getMaxFightPoints() // We are comparing the max fight points to the current health to get the amount of recovered fight points
		],
		defenderStats: [
			sender.getFightPoints()
		],
		statsEffect: [
			1
		]
	};
}
