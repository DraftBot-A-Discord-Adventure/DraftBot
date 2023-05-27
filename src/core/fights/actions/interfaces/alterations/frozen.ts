import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {FightAlteration} from "../../FightAlteration";
import {Translations} from "../../../../Translations";
import {FightWeather} from "../../../FightWeather";

export default class FrozenAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string, weather: FightWeather): string {
		victim.alterationTurn++;
		const frozenTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		// 50% chance to be healed from the frozen (except for the first two turns)
		if (Math.random() < 0.5 && victim.alterationTurn > 2) {
			victim.removeSpeedModifiers(this);
			victim.removeAlteration();
			return frozenTranslationModule.get("heal");
		}
		if (!victim.hasSpeedModifier(this)) {
			victim.applySpeedModifier({
				origin: this,
				operation: FightStatModifierOperation.MULTIPLIER,
				value: 0.4
			});
		}
		const damageDealt = Math.round((victim.getMaxBreath() - victim.getBreath()) * .2 * sender.getSpeed());
		victim.damage(damageDealt);
		return frozenTranslationModule.format("damage", {damage: damageDealt});
	}
}