import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAlteration} from "../../FightAlteration";
import {FightActions} from "../../FightActions";

export default class PetrifiedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const petrifiedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (victim.alterationTurn > 2) { // This effect heals after two turns
			victim.removeDefenseModifiers(this);
			victim.removeAlteration();
			return petrifiedTranslationModule.get("heal");
		}

		if (!victim.hasDefenseModifier(this)) {
			victim.applyDefenseModifier({
				origin: this,
				operation: FightStatModifierOperation.MULTIPLIER,
				value: 2
			});
			return petrifiedTranslationModule.get("new");
		}

		victim.nextFightAction = FightActions.getNoAttack();
		return petrifiedTranslationModule.get("active");
	}
}