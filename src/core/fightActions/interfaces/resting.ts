import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/Fighter";
import {Translations} from "../../Translations";
import {Data} from "../../Data";
import {FightActionController} from "../FightActionController";

type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };
type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const noneTranslationModule = Translations.getModule("fightactions." + this.getName(), language);
		sender.nextFightActionId = null;
		const recoveredFightPoints = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.getPlayerLevel(), this.getAttackInfo());
		sender.stats.fightPoints += recoveredFightPoints;
		return noneTranslationModule.format("active", {
			amount: recoveredFightPoints
		});
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "resting";
	},

	getAttackInfo(): attackInfo {
		return {minDamage: 0, averageDamage: 30, maxDamage: 50};
	},

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.maxFightPoint // we are comparing the max fight points to the current health to get the amount of recovered fight points
			], defenderStats: [
				sender.stats.fightPoints
			], statsEffect: [
				1
			]
		};
	}
};