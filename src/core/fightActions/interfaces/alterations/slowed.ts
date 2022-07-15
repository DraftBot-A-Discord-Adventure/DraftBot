import {IFightAction} from "../../IFightAction";
import {Fighter} from "../../../fights/Fighter";
import {Translations} from "../../../Translations";
import {Data} from "../../../Data";
import {FighterAlterationId} from "../../../fights/FighterAlterationId";

export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const slowedTranslationModule = Translations.getModule("fightactions." + this.getName(), language);
		if (sender.alterationTurn > 1) { // this effect heals after one turn
			sender.stats.speed = sender.readSavedStats().speed;
			sender.eraseSavedStats();
			sender.newAlteration(FighterAlterationId.NORMAL);
			return slowedTranslationModule.get("inactive");
		}
		if (!sender.hasSavedStats()) {
			sender.saveStats();
			sender.stats.speed = Math.round(sender.stats.speed * 0.1);
			return slowedTranslationModule.get("new");
		}
		return slowedTranslationModule.get("active");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "slowed";
	}
};