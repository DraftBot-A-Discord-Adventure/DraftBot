import {IFightAction} from "./IFightAction";
import Class from "../models/Class";
import {FightConstants} from "../constants/FightConstants";
import {RandomUtils} from "../utils/RandomUtils";
import {MathUtils} from "../utils/MathUtils";

declare const JsonReader: any;

type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };

export class FightActionController {

	/**
	 * get the fight action interface from a fight action id
	 * @param fightActionId
	 */
	static getFightActionInterface(fightActionId: string): IFightAction {
		return <IFightAction>(require("./interfaces/" + fightActionId).fightActionInterface);
	}

	/**
	 * list all fight actions for a class
	 * @param playerClass
	 */
	static listFightActionsFromClass(playerClass: Class): Map<string, IFightAction> {
		const listActions = new Map<string, IFightAction>();
		for (const action of playerClass.getFightActions()) {
			listActions.set(action, this.getFightActionInterface(action));
		}
		return listActions;
	}

	/**
	 * get the attack damage for a fight action
	 * @param attackerStats - array of the stats to use for the attacker
	 * @param defenderStats - array of the stats to use for the defender
	 * @param statsEffect - array of ratios to apply to the stats
	 * @param attackerLevel - the level of the attacker (used to get the bonus ratio)
	 * @param attackInfo - the attack info of the fight action
	 */
	static getAttackDamage(attackerStats: number[], defenderStats: number[], statsEffect: number[], attackerLevel: number, attackInfo: attackInfo): number {
		const levelBonusRatio = this.getLevelBonusRatio(attackerLevel);
		let attackDamage = 0;
		for (let i = 0; i < attackerStats.length; i++) {
			attackDamage += this.getAttackDamageByStat(attackerStats[i], defenderStats[i], attackInfo) * statsEffect[i];
		}
		return Math.round(attackDamage * (1 + levelBonusRatio));
	}

	/**
	 * get the amount of damage a fight action will deal from stats
	 * @param attackerStat
	 * @param defenderStat
	 * @param attackInfo
	 */
	private static getAttackDamageByStat(attackerStat: number, defenderStat: number, attackInfo: attackInfo): number {

		/*
		 * get the ratio between the attacker and the defender stats (between 0 and 1)
		 * the value is above 1 if the attacker is more than 70 % stronger than the defender
		 * the value is below 0 if the attacker is more than 70 % weaker than the defender
		 */
		const ratio = (this.statToStatPower(attackerStat) - this.statToStatPower(defenderStat)) / 70;

		let damage = ratio < 0 ? Math.round(
			// if the attacker is weaker than the defender, the damage is selected in the under the average damage interval
			MathUtils.getIntervalValue(attackInfo.minDamage, attackInfo.averageDamage, 1 - Math.abs(ratio))
		) : Math.round(
			// if the attacker is stronger than the defender, the damage is selected in the over the average damage interval
			MathUtils.getIntervalValue(attackInfo.averageDamage, attackInfo.maxDamage, ratio)
		);
		// add a random variation of 5% of the damage
		damage = Math.round(damage + damage * RandomUtils.randInt(-FightConstants.DAMAGE_RANDOM_VARIATION, FightConstants.DAMAGE_RANDOM_VARIATION) / 100);
		// return damage caped between max and min
		return damage > attackInfo.maxDamage ? attackInfo.maxDamage : damage < attackInfo.minDamage ? attackInfo.minDamage : damage;
	}

	/**
	 * return a value between 0 and 100, (more or less), representing the power of a stat
	 * here is the formula: f(x) = 100 * tanh(0.0023*x - 0.03) + 3
	 * (formula by Pokegali)
	 * @param stat
	 */
	static statToStatPower(stat: number): number {
		return 100 * Math.tanh(0.0023 * stat - 0.03) + 3;
	}


	/**
	 * get all fight actions ids
	 * @returns string[]
	 */
	static getAllFightActionsIds(): string[] {
		return Object.keys(JsonReader.fightactions);
	}

	/**
	 * get the level bonus ratio for a level
	 * @private
	 * @param level - the level of the player
	 */
	private static getLevelBonusRatio(level: number) {
		return MathUtils.getIntervalValue(FightConstants.PLAYER_LEVEL_MINIMAL_MALUS, FightConstants.PLAYER_LEVEL_MAXIMAL_BONUS, level / FightConstants.MAX_PLAYER_LEVEL_FOR_BONUSES) / 100;
	}
}