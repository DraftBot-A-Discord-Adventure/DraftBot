import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAlteration} from "../../FightAlteration";

export default class WeakAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const weakTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (victim.alterationTurn > 1) { // This effect heals after one turn
			victim.removeAttackModifiers(this);
			victim.removeAlteration();
			return weakTranslationModule.get("heal");
		}
		if (!victim.hasAttackModifier(this)) {
			// Attack is reduced by 70%
			victim.applyAttackModifier({
				origin: this,
				operation: FightStatModifierOperation.MULTIPLIER,
				value: 0.3
			});
			return weakTranslationModule.get("new");
		}
		return weakTranslationModule.get("active");
	}
}