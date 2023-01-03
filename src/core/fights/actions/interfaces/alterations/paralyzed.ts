import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActions} from "../../FightActions";
import {FightAlteration} from "../../FightAlteration";

export default class ParalyzedAlteration extends FightAlteration {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const paralyzedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (sender.alterationTurn > 2) { // this effect heals after two turns
			sender.removeAlteration();
			return paralyzedTranslationModule.get("inactive");
		}

		// 20% chance to not attack this turn
		if (Math.random() < 0.2) {
			sender.nextFightAction = FightActions.getNoAttack();
			return paralyzedTranslationModule.get("noAttack");
		}

		if (!sender.hasSavedStats()) {
			sender.saveStats();
			sender.stats.speed = Math.round(0);
			return paralyzedTranslationModule.get("new");
		}
		return paralyzedTranslationModule.get("active");
	}
}