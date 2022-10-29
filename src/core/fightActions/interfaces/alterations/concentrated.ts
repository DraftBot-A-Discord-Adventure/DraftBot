import {IFightAction} from "../../IFightAction";
import {Fighter} from "../../../fights/fighter/Fighter";
import {Translations} from "../../../Translations";
import {Data} from "../../../Data";
import {FighterAlterationId} from "../../../fights/FighterAlterationId";


export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const concentratedTranslationModule = Translations.getModule("fightactions." + this.getName(), language);
		if (sender.alterationTurn > 1) { // this effect heals after one turn
			sender.stats.speed = sender.readSavedStats().speed;
			sender.stats.attack = sender.readSavedStats().attack;
			sender.eraseSavedStats();
			sender.newAlteration(FighterAlterationId.NORMAL);
			return concentratedTranslationModule.get("heal");
		}
		if (!sender.hasSavedStats()) {
			sender.saveStats();
			sender.stats.speed *= 2;
			sender.stats.attack *= 2;
			return concentratedTranslationModule.get("new");
		}
		return concentratedTranslationModule.get("active");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "concentrated";
	}
};