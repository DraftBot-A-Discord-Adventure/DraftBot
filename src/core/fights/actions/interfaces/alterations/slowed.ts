import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAlteration} from "../../FightAlteration";

export default class SlowedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const slowedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (victim.alterationTurn > 1) { // this effect heals after one turn
			victim.stats.speed = victim.readSavedStats().speed;
			victim.eraseSavedStats();
			victim.removeAlteration();
			return slowedTranslationModule.get("inactive");
		}
		if (!victim.hasSavedStats()) {
			victim.saveStats();
			victim.stats.speed = Math.round(victim.stats.speed * 0.4);
			return slowedTranslationModule.get("new");
		}
		return slowedTranslationModule.get("active");
	}
}