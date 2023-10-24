import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAction} from "../../FightAction";

export default class OutOfBreath extends FightAction {
	use(fightAction: FightAction, sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.nextFightAction = null;
		return Translations.getModule(`fightactions.${this.name}`, language).get("active");
	}
}