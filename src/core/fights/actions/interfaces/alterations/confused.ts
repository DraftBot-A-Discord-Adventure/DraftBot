import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {PlayerFighter} from "../../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightActions} from "../../FightActions";

export default class ConfusedAlteration extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const randomValue = Math.random();

		const confusionTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);

		// 35 % to be healed of the confusion (except for the first turn)
		if (randomValue < 0.35 && sender.alterationTurn > 1) {
			sender.removeAlteration();
			return confusionTranslationModule.get("heal");
		}

		// 35 % chance that the confusion select a random action
		if (randomValue < 0.70) {
			sender.nextFightAction = sender.getRandomAvailableFightAction();
			return confusionTranslationModule.get("randomAction");
		}

		// 15 % chance that the confusion hurt the sender
		if (randomValue < 0.85) {
			const damageDealt = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
			sender.nextFightAction = FightActions.getNoAttack();
			sender.stats.fightPoints -= damageDealt;
			return confusionTranslationModule.format("damage", {damages: damageDealt});
		}

		return confusionTranslationModule.get("active");
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 5, averageDamage: 15, maxDamage: 35};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				receiver.stats.attack,
				sender.stats.attack
			], defenderStats: [
				100,
				100
			], statsEffect: [
				0.8,
				0.2
			]
		};
	}
}