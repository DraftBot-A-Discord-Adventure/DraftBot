import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAlteration} from "../../FightAlteration";

export default class ConcentratedAlteration extends FightAlteration {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const concentratedTranslationModule = Translations.getModule("fightactions." + this.name, language);
		if (sender.alterationTurn > 1) { // this effect heals after one turn
			sender.stats.speed = sender.readSavedStats().speed;
			sender.stats.attack = sender.readSavedStats().attack;
			sender.eraseSavedStats();
			sender.removeAlteration();
			return concentratedTranslationModule.get("heal");
		}
		if (!sender.hasSavedStats()) {
			sender.saveStats();
			sender.stats.speed *= 2;
			sender.stats.attack *= 2;
			return concentratedTranslationModule.get("new");
		}
		return concentratedTranslationModule.get("active");
	}
}