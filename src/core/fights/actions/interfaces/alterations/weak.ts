import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAction} from "../../FightAction";

export default class WeakAlteration extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const weakTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (sender.alterationTurn > 1) { // this effect heals after one turn
			sender.stats.attack = sender.readSavedStats().attack;
			sender.eraseSavedStats();
			sender.removeAlteration();
			return weakTranslationModule.get("heal");
		}
		if (!sender.hasSavedStats()) {
			sender.saveStats();
			// attack is reduced by 70%
			sender.stats.attack = Math.round(sender.stats.attack * 0.3);
			return weakTranslationModule.get("new");
		}
		return weakTranslationModule.get("active");
	}
}