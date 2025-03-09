import {Fighter} from "../../../fighter/Fighter";
import {FightAlterationFunc} from "../../../../../data/FightAlteration";
import {defaultDamageFightAlterationResult, defaultHealFightAlterationResult} from "../../../FightController";
import {attackInfo, statsInfo} from "../../FightActionController";

const use: FightAlterationFunc = (affected, _fightAlteration, opponent) => {
	// 35 % chance to be healed from the poison (except for the first two turns)
	if (Math.random() < 0.35 && affected.alterationTurn > 2) {
		return defaultHealFightAlterationResult(affected);
	}
	return defaultDamageFightAlterationResult(affected, getStatsInfo(affected, opponent), getAttackInfo());
};

export default use;

function getAttackInfo(): attackInfo {
	return {minDamage: 10, averageDamage: 20, maxDamage: 40};
}

function getStatsInfo(victim: Fighter, sender: Fighter): statsInfo {
	return {
		attackerStats: [
			victim.getAttack(), // We use the defender's attack because the poison is applied to the attacker
			sender.getAttack(),
			victim.getEnergy()
		], defenderStats: [
			100,
			100,
			victim.getMaxEnergy()
		], statsEffect: [
			0.5,
			0.1,
			0.4
		]
	};
}
