import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightAction} from "../../FightAction";
import {FightActions} from "../../FightActions";

export default class ChargeClubSmashAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// Set the next fight action of the sender to be the club smash attack
		sender.nextFightAction = FightActions.getFightActionById("clubSmashAttack");
		return attackTranslationModule.format("actions.attacksResults.charging", {
			attack: Translations.getModule(`fightactions.${this.name}`, language)
				.get("name")
				.toLowerCase()
		});
	}
}