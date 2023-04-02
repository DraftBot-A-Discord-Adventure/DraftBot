import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActions} from "../../FightActions";
import {FightAlteration} from "../../FightAlteration";

export default class ParalyzedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const paralyzedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (victim.alterationTurn > 2) { // this effect heals after two turns
			victim.removeAlteration();
			victim.stats.speed = victim.readSavedStats().speed;
			victim.eraseSavedStats();
			return paralyzedTranslationModule.get("inactive");
		}

		// 20% chance to not attack this turn
		if (Math.random() < 0.2) {
			victim.nextFightAction = FightActions.getNoAttack();
			return paralyzedTranslationModule.get("noAttack");
		}

		if (!victim.hasSavedStats()) {
			victim.saveStats();
			victim.stats.speed = Math.round(0);
			return paralyzedTranslationModule.get("new");
		}
		return paralyzedTranslationModule.get("active");
	}
}