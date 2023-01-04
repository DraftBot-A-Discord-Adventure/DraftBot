import {Fighter} from "../../fighter/Fighter";
import {FightAction} from "../FightAction";
import {Translations} from "../../../Translations";

export default class CounterAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {

		const couterAttackTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		if (turn <= 1) {
			return couterAttackTranslationModule.get("fail");
		}
		return receiver.getLastFightActionUsed().use(sender, receiver, turn - 1, language);
	}
}