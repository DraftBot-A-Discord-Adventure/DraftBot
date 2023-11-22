import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";

export default class HeavyAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		let damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 15);

		// This attack will do less damage if the opponent has lower defense than the attacker
		damageDealt *= receiver.getDefense() < sender.getDefense() ? 0.1 : 1;
		damageDealt = Math.round(damageDealt);
		const attackTranslationModule = Translations.getModule("commands.fight", language);
		receiver.damage(damageDealt);
		let sideEffects = "";

		// Reduce defense of the receiver by 25 %
		const reductionAmont = 25;
		receiver.applyDefenseModifier({
			origin: this,
			operation: FightStatModifierOperation.MULTIPLIER,
			value: 1 - reductionAmont / 100
		});
		sideEffects += attackTranslationModule.format("actions.sideEffects.defense", {
			adversary: FightConstants.TARGET.OPPONENT,
			operator: FightConstants.OPERATOR.MINUS,
			amount: reductionAmont
		});

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 50, averageDamage: 170, maxDamage: 240};
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