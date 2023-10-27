import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {RandomUtils} from "../../../../utils/RandomUtils";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionResult} from "@Lib/src/interfaces/FightActionResult";
import {FightAlterationDataController} from "@Core/src/data/FightAlteration";

const use: FightActionFunc = (sender, receiver) => {
	const initialDamage = FightActionController.getAttackDamage(getStatsInfo(sender, receiver), sender, getAttackInfo());
	const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 20, 20);

	const result: FightActionResult = {
		attackStatus: damageDealt.status,
		damages: damageDealt.damages
	};

	if (RandomUtils.draftbotRandom.bool(0.8)) {
		FightActionController.applyAlteration(result, {
			selfTarget: false,
			alteration: FightAlterationDataController.instance.getById(FightAlterations.BURNED)
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