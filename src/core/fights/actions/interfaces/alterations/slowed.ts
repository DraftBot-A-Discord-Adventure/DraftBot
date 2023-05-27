import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAlteration} from "../../FightAlteration";
import {FightWeather} from "../../../FightWeather";

export default class SlowedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string, weather: FightWeather): string {
		victim.alterationTurn++;
		const slowedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (victim.alterationTurn > 1) { // this effect heals after one turn
			victim.removeSpeedModifiers(this);
			victim.removeAlteration();
			return slowedTranslationModule.get("inactive");
		}
		if (!victim.hasSpeedModifier(this)) {
			victim.applySpeedModifier({
				origin: this,
				operation: FightStatModifierOperation.MULTIPLIER,
				value: 0.4
			});
			return slowedTranslationModule.get("new");
		}
		return slowedTranslationModule.get("active");
	}
}