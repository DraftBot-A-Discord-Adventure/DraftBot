import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionResult} from "@Lib/src/interfaces/FightActionResult";

function getAttackInfo(): attackInfo {
	return {
		minDamage: 45,
		averageDamage: 90,
		maxDamage: 150
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack()
		],
		defenderStats: [
			receiver.getDefense()
		],
		statsEffect: [
			1
		]
	};
}

const use: FightActionFunc = (_fight, _fightAction, sender, receiver, _turn) => {
	const initialDamage = FightActionController.getAttackDamage(getStatsInfo(sender, receiver), receiver, getAttackInfo());
	const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 30, 5);
	const result: FightActionResult = {
		attackStatus: damageDealt.status,
		damages: damageDealt.damages
	};
	receiver.damage(result.damages);

	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterations.TARGETED
	}, {
		sender,
		receiver
	});

	return result;
};

export default use;
