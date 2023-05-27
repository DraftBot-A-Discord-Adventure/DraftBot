import {FightAction} from "../../FightAction";
import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightWeather} from "../../../FightWeather";

export default class RockShieldAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string, weather: FightWeather): string {
		const defenseBuffTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);

		// reduce by half the damages of the next attack
		receiver.applyDamageMultiplier(0.5, 1);

		return defenseBuffTranslationModule.get("active");
	}
}