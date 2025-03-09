import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightActionController, statsInfo} from "../../FightActionController";
import {FightAlterations} from "../../FightAlterations";
import {RandomUtils} from "../../../../../../../Lib/src/utils/RandomUtils";
import {FightActionFunc} from "../../../../../data/FightAction";
import {FightActionResult} from "../../../../../../../Lib/src/types/FightActionResult";

const use: FightActionFunc = (sender, receiver) => {
	const initialDamage = FightActionController.getAttackDamage(getStatsInfo(sender, receiver), sender, getAttackInfo());
	const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 25, 12);

	const result: FightActionResult = {
		attackStatus: damageDealt.status,
		damages: damageDealt.damages
	};

	if (RandomUtils.draftbotRandom.bool(0.98)) {
		FightActionController.applyAlteration(result, {
			selfTarget: false,
			alteration: FightAlterations.BURNED
		}, receiver);
	}
	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 15,
		averageDamage: 100,
		maxDamage: 130
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack()
		],
		defenderStats: [
			receiver.getDefense() / 4
		],
		statsEffect: [
			1
		]
	};
}