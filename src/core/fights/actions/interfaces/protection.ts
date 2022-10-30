import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {FightConstants} from "../../../constants/FightConstants";
import {FightAction} from "../FightAction";
import {FightAlterations} from "../FightAlterations";

export default class Protection extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const protectionTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		const attackTranslationModule = Translations.getModule("commands.fight", language);
		const alteration = sender.newAlteration(FightAlterations.PROTECTED);
		if (alteration === FightAlterations.PROTECTED) {
			return protectionTranslationModule.get("active")
				+ attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.SELF,
					effect: attackTranslationModule.get("effects.protected").toLowerCase()
				});
		}
		return protectionTranslationModule.get("fail");
	}
}