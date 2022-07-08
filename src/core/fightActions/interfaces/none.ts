import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/Fighter";
import {Translations} from "../../Translations";
import {Data} from "../../Data";


export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const noneTranslationModule = Translations.getModule("fightactions." + this.getName(), language);
		sender.nextFightActionId = null;
		return noneTranslationModule.get("active");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "none";
	}
};