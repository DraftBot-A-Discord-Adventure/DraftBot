import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {FightAction} from "../FightAction";

export default class DefenseBuff extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const noneTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);

		// amount of times the sender has used the move already in its 5 last moves
		const streak = sender.fightActionsHistory.slice(-3).filter(action => action instanceof DefenseBuff).length;

		const defenseBuffArray = [20, 25, 35, 40];

		sender.stats.defense += Math.round(sender.stats.defense * defenseBuffArray[streak] / 100 + 1);

		return noneTranslationModule.format("active", {
			amount: defenseBuffArray[streak]
		});
	}
}