import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {FightConstants} from "../../../constants/FightConstants";
import {FightAction} from "../FightAction";
import {FightAlterations} from "../FightAlterations";

export default class Concentration extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {

		const attackTranslationModule = Translations.getModule("commands.fight", language);
		const concentrationTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		const alteration = sender.newAlteration(FightAlterations.CONCENTRATED);

		if (alteration === FightAlterations.CONCENTRATED) {
			return concentrationTranslationModule.get("active") + attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.SELF,
				effect: attackTranslationModule.get("effects.concentrated").toLowerCase()
			});
		}
		return concentrationTranslationModule.get("fail");
	}
}