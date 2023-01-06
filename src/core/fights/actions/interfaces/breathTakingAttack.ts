import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {FightConstants} from "../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../FightAction";
import {FightActionController} from "../FightActionController";
import {PlayerFighter} from "../../fighter/PlayerFighter";
import {format} from "../../../utils/StringFormatter";
import {RandomUtils} from "../../../utils/RandomUtils";

export default class BreathTakingAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());

		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 1, 10);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// 50% chance of reducing the opponent's speed by 20%. Otherwise, steal 1 point of breath from the opponent.
		let sideEffects;
		if (RandomUtils.draftbotRandom.bool(0.5)) {
			// Reduce target speed by 20%
			const reduceAmount = 20;
			receiver.stats.defense = Math.round(receiver.stats.speed - receiver.stats.speed * reduceAmount / 100);
			sideEffects = attackTranslationModule.format("actions.sideEffects.speed", {
				adversary: FightConstants.TARGET.OPPONENT,
				operator: FightConstants.OPERATOR.MINUS,
				amount: reduceAmount
			});
		}
		else {
			// Steal 1 point of breath
			sideEffects = attackTranslationModule.format("actions.sideEffects.breath", {
				adversary: FightConstants.TARGET.OPPONENT,
				operator: FightConstants.OPERATOR.MINUS,
				amount: 1
			});
			sideEffects += attackTranslationModule.format("actions.sideEffects.breath", {
				adversary: FightConstants.TARGET.SELF,
				operator: FightConstants.OPERATOR.PLUS,
				amount: 1
			});
			receiver.stats.breath -= 1;
			sender.stats.breath += 1;
		}


		receiver.stats.fightPoints -= damageDealt;

		const attackStatus = this.getAttackStatus(damageDealt, initialDamage);
		const chosenString = attackTranslationModule.getRandom(`actions.attacksResults.${attackStatus}`);
		return format(chosenString, {
			attack: Translations.getModule(`fightactions.${this.name}`, language)
				.get("name")
				.toLowerCase()
		}) + sideEffects + Translations.getModule("commands.fight", language).format("actions.damages", {
			damages: damageDealt
		});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 30, averageDamage: 60, maxDamage: 100};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.attack,
				sender.stats.speed
			], defenderStats: [
				receiver.stats.defense,
				receiver.stats.speed
			], statsEffect: [
				0.7,
				0.3
			]
		};
	}
}