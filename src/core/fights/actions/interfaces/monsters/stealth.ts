import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAction} from "../../FightAction";

export default class Stealth extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const stealthTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		sender.applyDamageMultiplier(2, 1);
		return stealthTranslationModule.get("active");
	}
}