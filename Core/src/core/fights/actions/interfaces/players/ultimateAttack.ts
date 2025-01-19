import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightActionController, statsInfo} from "../../FightActionController";
import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "../../../../../data/FightAction";
import {FightActionResult} from "../../../../../../../Lib/src/types/FightActionResult";

const use: FightActionFunc = (sender, receiver) => {
	const initialDamage = FightActionController.getAttackDamage(getStatsInfo(sender, receiver), sender, getAttackInfo());

	// Check if the sender has less than 45% of his fight points
	const failureProbability = sender.getFightPoints() < sender.getMaxFightPoints() * 0.45 ? 0 : 70;

	const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 20, failureProbability);

	const result: FightActionResult = {
		attackStatus: damageDealt.status,
		damages: damageDealt.damages
	};

	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterations.SLOWED
	}, receiver);

	return result;
};

function getAttackInfo(): attackInfo {
	return {
		minDamage: 100,
		averageDamage: 250,
		maxDamage: 350
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack(),
			sender.getSpeed() * 3
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

export default use;