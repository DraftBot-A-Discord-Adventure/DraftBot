import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightConstants} from "../../../../constants/FightConstants";
import {FightAction} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {FightActions} from "../../FightActions";
import {FightWeather} from "../../../FightWeather";

export default class PetrificationAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string, weather: FightWeather): string {
		const attackTranslationModule = Translations.getModule("commands.fight", language);
		const petrificationTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		const alteration = receiver.newAlteration(FightAlterations.PETRIFIED);

		if (alteration === FightAlterations.PETRIFIED) {
			receiver.nextFightAction = FightActions.getNoAttack();
			return petrificationTranslationModule.get("active") + attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.SELF,
				effect: attackTranslationModule.get("effects.petrified").toLowerCase()
			});
		}

		return petrificationTranslationModule.get("fail");
	}
}