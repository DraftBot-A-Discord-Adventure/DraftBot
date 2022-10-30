import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {FightAction} from "../FightAction";

export default class NoneAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.nextFightAction = null;
		return Translations.getModule(`fightactions.${this.name}`, language).get("active");
	}
}