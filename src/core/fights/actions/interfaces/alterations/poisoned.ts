import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {format} from "../../../../utils/StringFormatter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlteration} from "../../FightAlteration";

export default class PoisonedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const poisonTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		// 25 % chance to be healed from the poison (except for the first turn)
		if (Math.random() < 0.25 && victim.alterationTurn > 1) {
			victim.removeAlteration();
			return poisonTranslationModule.get("heal");
		}
		const damageDealt = FightActionController.getAttackDamage(this.getStatsInfo(victim, sender), sender.level, this.getAttackInfo());
		victim.damage(damageDealt);
		return format(poisonTranslationModule.get("damage"), {damages: damageDealt});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 10, averageDamage: 25, maxDamage: 45};
	}

	getStatsInfo(victim: Fighter, sender: Fighter): statsInfo {
		return {
			attackerStats: [
				victim.getAttack(), // we use the defender's attack because the poison is applied to the attacker
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
}