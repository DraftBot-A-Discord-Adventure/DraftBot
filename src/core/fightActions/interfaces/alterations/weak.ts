import {IFightAction} from "../../IFightAction";
import {Fighter} from "../../../fights/fighter/Fighter";
import {Translations} from "../../../Translations";
import {Data} from "../../../Data";
import {FighterAlterationId} from "../../../fights/FighterAlterationId";


export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const weakTranslationModule = Translations.getModule("fightactions." + this.getName(), language);
		if (sender.alterationTurn > 1) { // this effect heals after one turn
			sender.stats.attack = sender.readSavedStats().attack;
			sender.eraseSavedStats();
			sender.newAlteration(FighterAlterationId.NORMAL);
			return weakTranslationModule.get("heal");
		}
		if (!sender.hasSavedStats()) {
			sender.saveStats();
			// attack is reduced by 70%
			sender.stats.attack = Math.round(sender.stats.attack * 0.3);
			return weakTranslationModule.get("new");
		}
		return weakTranslationModule.get("active");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "weak";
	}
};