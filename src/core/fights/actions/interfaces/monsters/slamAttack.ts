import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightConstants} from "../../../../constants/FightConstants";
import {Translations} from "../../../../Translations";

export default class SlamAttack extends FightAction {
	use(fightAction: FightAction, sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 0, 0);
		receiver.damage(damageDealt);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// Reduce opponent speed by 10%
		const statsReducePercentage = 10;
		receiver.applySpeedModifier({
			origin: this,
			operation: FightStatModifierOperation.MULTIPLIER,
			value: 1 - statsReducePercentage / 100
		});
		const sideEffects = attackTranslationModule.format("actions.sideEffects.speed", {
			adversary: FightConstants.TARGET.OPPONENT,
			operator: FightConstants.OPERATOR.MINUS,
			amount: statsReducePercentage
		});

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 20, averageDamage: 60, maxDamage: 110};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack(),
				sender.getSpeed()
			], defenderStats: [
				receiver.getSpeed(),
				receiver.getSpeed()
			], statsEffect: [
				0.5,
				0.5
			]
		};
	}
}