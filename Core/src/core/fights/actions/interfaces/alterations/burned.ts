import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, statsInfo} from "../../FightActionController";
import {FightAlterationFunc} from "../../../../../data/FightAlteration";
import {defaultDamageFightAlterationResult, defaultHealFightAlterationResult} from "../../../FightController";

const use: FightAlterationFunc = (affected, _fightAlteration, opponent) => {
	// 60 % chance to be healed from the fire (except for the first turn)
	if (Math.random() < 0.6 && affected.alterationTurn > 1) {
		return defaultHealFightAlterationResult(affected);
	}
	return defaultDamageFightAlterationResult(affected, getStatsInfo(affected, opponent), getAttackInfo());
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 5,
		averageDamage: 50,
		maxDamage: 65
	};
}

function getStatsInfo(affected: Fighter, opponent: Fighter): statsInfo {
	return {
		attackerStats: [
			opponent.getAttack()
		],
		defenderStats: [
			affected.getDefense() / 4
		],
		statsEffect: [
			1
		]
	};
}