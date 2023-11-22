import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAlteration} from "../../FightAlteration";

export default class ConcentratedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const concentratedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (victim.alterationTurn > 1) { // This effect heals after one turn
			victim.removeAttackModifiers(this);
			victim.removeSpeedModifiers(this);
			victim.removeAlteration();
			return concentratedTranslationModule.get("heal");
		}
		if (!victim.hasAttackModifier(this)) {
			victim.applyDamageMultiplier(1.4,1);
			return concentratedTranslationModule.get("new");
		}
		return concentratedTranslationModule.get("active");
	}
}