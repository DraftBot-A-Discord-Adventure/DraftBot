import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightActionController} from "../../FightActionController";
import {RandomUtils} from "../../../../utils/RandomUtils";

export default class BreathTakingAttack extends FightAction {
	use(fightAction: FightAction, sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());

		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 1, 10);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// 60% chance of reducing the opponent's speed by 20%. Otherwise, steal 1 point of breath from the opponent.
		let sideEffects;
		if (RandomUtils.draftbotRandom.bool(0.4) || receiver.getBreath() < 1) {
			// Reduce target speed by 20%
			const reduceAmount = 20;
			receiver.applySpeedModifier({
				origin: this,
				operation: FightStatModifierOperation.MULTIPLIER,
				value: 1 - reduceAmount / 100
			});
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
			receiver.addBreath(-1);
			sender.addBreath(1);
		}

		receiver.damage(damageDealt);

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 30, averageDamage: 60, maxDamage: 100};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack(),
				sender.getSpeed()
			], defenderStats: [
				receiver.getDefense(),
				receiver.getSpeed()
			], statsEffect: [
				0.7,
				0.3
			]
		};
	}
}