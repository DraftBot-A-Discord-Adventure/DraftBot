import {IFightAction} from "../../IFightAction";
import {Fighter} from "../../../fights/Fighter";
import {Translations} from "../../../Translations";
import {Data} from "../../../Data";
import {FighterAlterationId} from "../../../fights/FighterAlterationId";

export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const protectedTranslationModule = Translations.getModule("fightactions." + this.getName(), language);
		if (sender.alterationTurn > 2) { // this effect heals after two turns
			sender.stats.defense = sender.readSavedStats().defense;
			sender.eraseSavedStats();
			sender.newAlteration(FighterAlterationId.NORMAL);
			return protectedTranslationModule.get("inactive");
		}
		if (!sender.hasSavedStats()) {
			sender.saveStats();
			sender.stats.defense = Math.round(sender.stats.defense * 1.3);
			return protectedTranslationModule.get("new");
		}
		return protectedTranslationModule.get("active");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "protected";
	}
};