import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlteration} from "../../FightAlteration";
import {MathUtils} from "../../../../utils/MathUtils";
import {FightConstants} from "../../../../constants/FightConstants";
import {FightWeather} from "../../../FightWeather";

export default class PoisonedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string, weather: FightWeather): string {
		victim.alterationTurn++;
		const curseTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		// 50 % chance to be healed from the cursed (except for the first two turn) and 100 % after 5 turns of being cursed
		if (Math.random() < 0.25 && victim.alterationTurn > 2 || victim.alterationTurn > 4) {
			victim.removeAlteration();
			let damageDealt = FightActionController.getAttackDamage(this.getStatsInfo(victim, sender), victim, this.getAttackInfo(), true);
			damageDealt += MathUtils.getIntervalValue(0, damageDealt * 2, (victim.alterationTurn - 2) / 3);
			damageDealt += MathUtils.getIntervalValue(0, damageDealt, turn / FightConstants.MAX_TURNS);
			damageDealt = Math.round(damageDealt);
			victim.damage(damageDealt);
			return curseTranslationModule.format("heal", {damages: damageDealt});
		}

		return curseTranslationModule.get("damage");
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 60, averageDamage: 95, maxDamage: 135};
	}

	getStatsInfo(victim: Fighter, sender: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack()
			], defenderStats: [
				victim.getDefense()
			], statsEffect: [
				1
			]
		};
	}
}