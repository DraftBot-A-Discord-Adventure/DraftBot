import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAction} from "../../FightAction";

export default class SlowedAlteration extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const slowedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (sender.alterationTurn > 1) { // this effect heals after one turn
			sender.stats.speed = sender.readSavedStats().speed;
			sender.eraseSavedStats();
			sender.removeAlteration();
			return slowedTranslationModule.get("inactive");
		}
		if (!sender.hasSavedStats()) {
			sender.saveStats();
			sender.stats.speed = Math.round(sender.stats.speed * 0.1);
			return slowedTranslationModule.get("new");
		}
		return slowedTranslationModule.get("active");
	}
}