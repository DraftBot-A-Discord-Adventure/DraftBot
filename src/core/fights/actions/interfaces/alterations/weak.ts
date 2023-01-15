import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAlteration} from "../../FightAlteration";

export default class WeakAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const weakTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (victim.alterationTurn > 1) { // this effect heals after one turn
			victim.stats.attack = victim.readSavedStats().attack;
			victim.eraseSavedStats();
			victim.removeAlteration();
			return weakTranslationModule.get("heal");
		}
		if (!victim.hasSavedStats()) {
			victim.saveStats();
			// attack is reduced by 70%
			victim.stats.attack = Math.round(victim.stats.attack * 0.3);
			return weakTranslationModule.get("new");
		}
		return weakTranslationModule.get("active");
	}
}