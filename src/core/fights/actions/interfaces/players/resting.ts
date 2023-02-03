import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";

export default class Resting extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const restingTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);

		const count = sender.fightActionsHistory.filter(action => action instanceof Resting).length;

		sender.nextFightAction = null;

		// recovered fight points are reduced after the fourth use of this action
		const recoveredFightPoints = count < 4 ?
			FightActionController.getAttackDamage(
				this.getStatsInfo(sender), sender, this.getAttackInfo(), true
			) : Math.round(
				FightActionController.getAttackDamage(this.getStatsInfo(sender), sender, this.getAttackInfo(), true) / 4
			);

		sender.heal(recoveredFightPoints);
		return restingTranslationModule.format("active", {
			amount: recoveredFightPoints
		});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 0, averageDamage: 30, maxDamage: 50};
	}

	getStatsInfo(sender: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getMaxFightPoints() // we are comparing the max fight points to the current health to get the amount of recovered fight points
			], defenderStats: [
				sender.getFightPoints()
			], statsEffect: [
				1
			]
		};
	}
}