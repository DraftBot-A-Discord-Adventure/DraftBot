import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightWeather} from "../../../FightWeather";

export default class PiercingAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string, weather: FightWeather): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 10);

		receiver.damage(damageDealt);

		let sideEffects = "";
		const attackTranslationModule = Translations.getModule("commands.fight", language);


		// 45% chance to lower the target's defense by 10%
		if (Math.random() < 0.45) {
			const reductionAmont = 10;
			receiver.applyDefenseModifier({
				origin: this,
				operation: FightStatModifierOperation.MULTIPLIER,
				value: 1 - reductionAmont / 100
			});
			sideEffects = attackTranslationModule.format("actions.sideEffects.defense", {
				adversary: FightConstants.TARGET.OPPONENT,
				operator: FightConstants.OPERATOR.MINUS,
				amount: reductionAmont
			});
		}

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 20, averageDamage: 80, maxDamage: 150};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack(),
				sender.getSpeed()
			], defenderStats: [
				receiver.getDefense() * 0.2,
				receiver.getSpeed()
			], statsEffect: [
				0.8,
				0.2
			]
		};
	}
}