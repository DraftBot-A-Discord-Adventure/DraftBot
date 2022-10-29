import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/fighter/Fighter";
import {Translations} from "../../Translations";
import {Data} from "../../Data";

export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// check the amount of ultimate attacks the sender already used
		const usedUltimateAttacks = sender.fightActionsHistory.filter(action => action === this.getName()).length;

		// if the sender already used the maximum amount of ultimate attacks, he can't use it anymore
		if (usedUltimateAttacks >= 1) {
			return attackTranslationModule.format("actions.attacksResults.maxUses", {
				attack: Translations.getModule("fightactions." + this.getName(), language)
					.get("name")
					.toLowerCase()
			});
		}
		// set the next fight action of the sender to be the ultimate attack
		sender.nextFightActionId = "ultimateAttack";
		return attackTranslationModule.format("actions.attacksResults.charging", {
			attack: Translations.getModule("fightactions." + this.getName(), language)
				.get("name")
				.toLowerCase()
		});
	},

	toString(language: string): string {
		return Translations.getModule(`fightactions.${this.getName()}`, language).get("name");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "chargeUltimateAttack";
	}
};