import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActions} from "../../FightActions";
import {FightAlteration} from "../../FightAlteration";

export default class StunnedAlteration extends FightAlteration {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const stunnedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (sender.alterationTurn > 1) { // this effect heals after one turn
			sender.removeAlteration();
			return stunnedTranslationModule.get("inactive");
		}

		// 50% chance to not attack this turn
		if (Math.random() < 0.5) {
			sender.nextFightAction = FightActions.getNoAttack();
			return stunnedTranslationModule.get("noAttack");
		}
		return stunnedTranslationModule.get("active");
	}
}