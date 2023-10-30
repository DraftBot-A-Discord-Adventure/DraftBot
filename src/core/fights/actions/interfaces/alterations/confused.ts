import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, statsInfo} from "../../FightActionController";
import {FightAlterationFunc} from "../../../../../data/FightAlteration";
import {FightActionDataController} from "../../../../../data/FightAction";
import {defaultDamageFightAlterationResult, defaultFightAlterationResult, defaultHealFightAlterationResult, defaultRandomActionFightAlterationResult} from "../../../FightController";

const use: FightAlterationFunc = (affected, _fightAlteration, opponent) => {
	const randomValue = Math.random();

	// 35 % to be healed of the confusion (except for the first turn)
	if (randomValue < 0.35 && affected.alterationTurn > 1) {
		return defaultHealFightAlterationResult(affected);
	}

	// 35 % chance that the confusion select a random action
	if (randomValue < 0.70) {
		return defaultRandomActionFightAlterationResult(affected);
	}

	// 15 % chance that the confusion hurt the sender
	if (randomValue < 0.85) {
		affected.nextFightAction = FightActionDataController.instance.getNone();
		return defaultDamageFightAlterationResult(affected, getStatsInfo(affected, opponent), getAttackInfo());
	}

	return defaultFightAlterationResult();
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 5,
		averageDamage: 15,
		maxDamage: 35
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			receiver.getAttack(),
			sender.getAttack()
		],
		defenderStats: [
			100,
			100
		],
		statsEffect: [
			0.8,
			0.2
		]
	};
}
