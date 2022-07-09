import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/Fighter";
import {Translations} from "../../Translations";
import {Data} from "../../Data";


export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const noneTranslationModule = Translations.getModule("fightactions." + this.getName(), language);

		// amount of times the sender has used the move already in its 5 last moves
		const streak = sender.fightActionsHistory.slice(-3).filter(action => action === this.getName()).length;

		const defenseBuffArray = [10, 15, 25, 30];

		sender.stats.defense += Math.round(sender.stats.defense * defenseBuffArray[streak] / 100 + 1) ;

		return noneTranslationModule.format("active", {
			amount: defenseBuffArray[streak]
		});
	},

	toString(language: string): string {
		return Translations.getModule(`fightactions.${this.getName()}`, language).get("name");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "defenseBuff";
	}
};