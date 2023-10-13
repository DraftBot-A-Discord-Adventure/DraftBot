import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActions} from "../../FightActions";
import {FightAlteration} from "../../FightAlteration";

export default class StunnedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const stunnedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (victim.alterationTurn > 1) { // This effect heals after one turn
			victim.removeAlteration();
			return stunnedTranslationModule.get("inactive");
		}

		// 50% chance to not attack this turn
		if (Math.random() < 0.5) {
			victim.nextFightAction = FightActions.getNoAttack();
			return stunnedTranslationModule.get("noAttack");
		}
		return stunnedTranslationModule.get("active");
	}
}