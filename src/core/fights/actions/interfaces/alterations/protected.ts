import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAlteration} from "../../FightAlteration";

export default class ProtectedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const protectedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (victim.alterationTurn > 2) { // this effect heals after two turns
			victim.stats.defense = victim.readSavedStats().defense;
			victim.eraseSavedStats();
			victim.removeAlteration();
			return protectedTranslationModule.get("inactive");
		}
		if (!victim.hasSavedStats()) {
			victim.saveStats();
			victim.stats.defense = Math.round(victim.stats.defense * 1.3);
			return protectedTranslationModule.get("new");
		}
		return protectedTranslationModule.get("active");
	}
}