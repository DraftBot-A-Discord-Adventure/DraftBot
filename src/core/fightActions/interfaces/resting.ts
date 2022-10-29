import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/fighter/Fighter";
import {Translations} from "../../Translations";
import {Data} from "../../Data";
import {FightActionController} from "../FightActionController";
import {PlayerFighter} from "../../fights/fighter/PlayerFighter";

type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };
type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const restingTranslationModule = Translations.getModule(`fightactions.${this.getName()}`, language);

		const count = sender.fightActionsHistory.filter(action => action === this.getName()).length;

		sender.nextFightActionId = null;

		// recovered fight points are reduced after the fourth use of this action
		const recoveredFightPoints = count < 4 ?
			FightActionController.getAttackDamage(
				this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo()
			) : Math.round(
				FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo()) / 4
			);

		sender.stats.fightPoints += recoveredFightPoints;
		if (sender.stats.fightPoints > sender.stats.maxFightPoint) {
			sender.stats.fightPoints = sender.stats.maxFightPoint;
		}
		return restingTranslationModule.format("active", {
			amount: recoveredFightPoints
		});
	},

	toString(language: string): string {
		return Translations.getModule(`fightactions.${this.getName()}`, language).get("name");
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