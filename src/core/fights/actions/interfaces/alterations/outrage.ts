import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAlteration} from "../../FightAlteration";
import {FightAlterations} from "../../FightAlterations";

export default class OutrageAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const outrageTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (victim.alterationTurn > 2) { // This effect heals after two turns
			victim.removeAttackModifiers(this);
			victim.removeSpeedModifiers(this);
			victim.removeAlteration();
			victim.newAlteration(FightAlterations.STUNNED);
			return outrageTranslationModule.get("heal");
		}
		if (!victim.hasAttackModifier(this)) {
			victim.applyDefenseModifier({
				origin: this,
				operation: FightStatModifierOperation.MULTIPLIER,
				value: 0.25
			});
			victim.applyAttackModifier({
				origin: this,
				operation: FightStatModifierOperation.MULTIPLIER,
				value: 2
			});
			return outrageTranslationModule.get("new");
		}
		return outrageTranslationModule.get("active");
	}
}