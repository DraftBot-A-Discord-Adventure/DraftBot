import {IFightAction} from "../../IFightAction";
import {Fighter} from "../../../fights/Fighter";
import {Translations} from "../../../Translations";
import {Data} from "../../../Data";
import {FighterAlterationId} from "../../../fights/FighterAlterationId";

type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

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
		sender.saveStats();
		sender.stats.speed = 0;
		return slowedTranslationModule.get("active");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "slowed";
	},

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				receiver.stats.attack // we use the defender's attack because the poison is applied to the attacker
			], defenderStats: [
				0 // poison is not affected by defense
			], statsEffect: [
				1
			]
		};
	}
};