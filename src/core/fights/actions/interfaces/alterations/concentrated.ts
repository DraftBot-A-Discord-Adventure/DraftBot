import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAlteration} from "../../FightAlteration";

export default class ConcentratedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const concentratedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (victim.alterationTurn > 1) { // this effect heals after one turn
			victim.stats.speed = victim.readSavedStats().speed;
			victim.stats.attack = victim.readSavedStats().attack;
			victim.eraseSavedStats();
			victim.removeAlteration();
			return concentratedTranslationModule.get("heal");
		}
		if (!victim.hasSavedStats()) {
			victim.saveStats();
			victim.stats.speed *= 2;
			victim.stats.attack *= 2;
			return concentratedTranslationModule.get("new");
		}
		return concentratedTranslationModule.get("active");
	}
}