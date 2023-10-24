import {Fighter} from "../../../fighter/Fighter";
import {FightAction} from "../../FightAction";
import {Translations} from "../../../../Translations";
import {FightConstants} from "../../../../constants/FightConstants";
import {FightWeather} from "../../../FightWeather";

export default class CounterAttack extends FightAction {
	use(fightAction: FightAction, sender: Fighter, receiver: Fighter, turn: number, language: string, weather: FightWeather): string | Promise<string> {

		// Of course, it should not be possible to counter on the first turn
		const counterAttackTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (turn <= 1) {
			return counterAttackTranslationModule.get("fail");
		}

		const lastAttack = receiver.getLastFightActionUsed();
		// We also want to check for a few moves that should not be countered
		if (FightConstants.UNCOUNTERABLE_ACTIONS.includes(lastAttack.name)) {
			return counterAttackTranslationModule.get("fail");
		}

		return lastAttack.use(sender, receiver, turn, language, weather);
	}
}