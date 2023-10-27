import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlterationFunc} from "@Core/src/data/FightAlteration";
import {defaultDamageFightAlterationResult, defaultHealFightAlterationResult} from "@Lib/src/interfaces/FightAlterationResult";

const use: FightAlterationFunc = (affected, _fightAlteration, opponent) => {
	// 25 % chance to be healed from the poison (except for the first turn)
	if (Math.random() < 0.25 && affected.alterationTurn > 1) {
		return defaultHealFightAlterationResult(affected);
	}
	return defaultDamageFightAlterationResult(affected, getStatsInfo(affected, opponent), getAttackInfo());
};

export default use;

function getAttackInfo(): attackInfo {
	return {minDamage: 10, averageDamage: 25, maxDamage: 45};
}

function getStatsInfo(victim: Fighter, sender: Fighter): statsInfo {
	return {
		attackerStats: [
			victim.getAttack(), // We use the defender's attack because the poison is applied to the attacker
			sender.getAttack(),
			victim.getFightPoints()
		], defenderStats: [
			100,
			100,
			victim.getMaxFightPoints()
		], statsEffect: [
			0.5,
			0.1,
			0.4
		]
	};
}
