import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAction} from "../../FightAction";

export default class ProtectedAlteration extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const protectedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (sender.alterationTurn > 2) { // this effect heals after two turns
			sender.stats.defense = sender.readSavedStats().defense;
			sender.eraseSavedStats();
			sender.removeAlteration();
			return protectedTranslationModule.get("inactive");
		}
		if (!sender.hasSavedStats()) {
			sender.saveStats();
			sender.stats.defense = Math.round(sender.stats.defense * 1.3);
			return protectedTranslationModule.get("new");
		}
		return protectedTranslationModule.get("active");
	}
}