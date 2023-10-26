import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionResult, FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightActionStatus} from "@Lib/src/interfaces/FightActionStatus";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";

const use: FightActionFunc = (_fight, fightAction, sender) => {
	const count = sender.fightActionsHistory.filter(action => action.id === "resting").length;

	sender.nextFightAction = null;

	// Recovered fight points are reduced after the fourth use of this action
	const recoveredFightPoints = Math.round(FightActionController.getAttackDamage(getStatsInfo(sender), sender, getAttackInfo(), true) / (count < 4 ? 1 : 4));

	const result: FightActionResult = {
		attackStatus: FightActionStatus.NORMAL,
		damages: 0
	};
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
	return {minDamage: 15, averageDamage: 60, maxDamage: 110};
}

function getStatsInfo(sender: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getMaxFightPoints() // We are comparing the max fight points to the current health to get the amount of recovered fight points
		], defenderStats: [
			sender.getFightPoints()
		], statsEffect: [
			1
		]
	};
}
