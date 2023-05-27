import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightConstants} from "../../../../constants/FightConstants";
import {FightAction} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {FightWeather} from "../../../FightWeather";

export default class OutrageAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string, weather: FightWeather): string {

		const attackTranslationModule = Translations.getModule("commands.fight", language);
		const outrageTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		const alteration = sender.newAlteration(FightAlterations.OUTRAGE);

		if (alteration === FightAlterations.OUTRAGE) {
			return outrageTranslationModule.get("active") + attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.SELF,
				effect: attackTranslationModule.get("effects.outrage").toLowerCase()
			});
		}
		return outrageTranslationModule.get("fail");
	}
}