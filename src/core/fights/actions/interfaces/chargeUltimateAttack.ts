import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {FightAction} from "../FightAction";
import {FightActions} from "../FightActions";

export default class ChargeUltimateAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// check the amount of ultimate attacks the sender already used
		const usedUltimateAttacks = sender.fightActionsHistory.filter(action => action instanceof ChargeUltimateAttack).length;

		// if the sender already used the maximum amount of ultimate attacks, he can't use it anymore
		if (usedUltimateAttacks >= 1) {
			return attackTranslationModule.format("actions.attacksResults.maxUses", {
				attack: Translations.getModule("fightactions." + this.name, language)
					.get("name")
					.toLowerCase()
			});
		}
		// set the next fight action of the sender to be the ultimate attack
		sender.nextFightAction = FightActions.getFightActionById("ultimateAttack");
		return attackTranslationModule.format("actions.attacksResults.charging", {
			attack: Translations.getModule("fightactions." + this.name, language)
				.get("name")
				.toLowerCase()
		});
	}
}