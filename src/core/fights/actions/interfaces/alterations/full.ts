import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActions} from "../../FightActions";
import {FightAlteration} from "../../FightAlteration";
import {FightWeather} from "../../../FightWeather";

export default class FullAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string, weather: FightWeather): string {
		victim.alterationTurn++;
		const fullTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);

		if (victim.alterationTurn > 2) { // this effect heals after two turns
			victim.removeAlteration();
			return fullTranslationModule.get("heal");
		}

		victim.nextFightAction = FightActions.getNoAttack();

		if (!victim.hasSpeedModifier(this)) {
			victim.applySpeedModifier({
				origin: this,
				operation: FightStatModifierOperation.MULTIPLIER,
				value: 0
			});
			return fullTranslationModule.get("new");
		}

		return fullTranslationModule.get("active");
	}
}