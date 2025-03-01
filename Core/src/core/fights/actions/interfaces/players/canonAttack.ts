import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightActionController, statsInfo} from "../../FightActionController";
import {MathUtils} from "../../../../utils/MathUtils";
import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "../../../../../data/FightAction";
import {FightActionResult} from "../../../../../../../Lib/src/types/FightActionResult";

const use: FightActionFunc = (sender, receiver) => {

	// This attack will miss more if the opponent is fast
	const initialDamage = FightActionController.getAttackDamage(getStatsInfo(sender, receiver), sender, getAttackInfo());
	const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 15, MathUtils.getIntervalValue(5, 35, (receiver.getSpeed() + 20) / 320));

	// If the attack was used two times in a row, the damage is multiplied by 1.5
	const lastFightAction = sender.getLastFightActionUsed();
	if (lastFightAction.id === "canonAttack") {
		damageDealt.damages = Math.round(damageDealt.damages * 1.5);
	}

	const result: FightActionResult = {
		attackStatus: damageDealt.status,
		damages: damageDealt.damages
	};

	// The receiver has a 65% chance to be slowed
	if (Math.random() < 0.65) {
		FightActionController.applyAlteration(result, {
			selfTarget: false,
			alteration: FightAlterations.SLOWED
		}, receiver);
	}
	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 20,
		averageDamage: 120,
		maxDamage: 250
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack(),
			120
		],
		defenderStats: [
			receiver.getDefense(),
			receiver.getSpeed()
		],
		statsEffect: [
			0.5,
			0.5
		]
	};
}