import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {RandomUtils} from "../../../../utils/RandomUtils";

export default class DarkAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), receiver, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 40, 15);

		receiver.damage(damageDealt);

		const attackTranslationModule = Translations.getModule("commands.fight", language);
		let sideEffects = "";

		if (RandomUtils.draftbotRandom.bool(0.65)) {
			receiver.applyAttackModifier({
				origin: this,
				operation: FightStatModifierOperation.ADDITION,
				value: -receiver.getAttack() * 0.15
			});
			sideEffects = attackTranslationModule.format("actions.sideEffects.attack", {
				adversary: FightConstants.TARGET.OPPONENT,
				operator: FightConstants.OPERATOR.MINUS,
				amount: 15
			});
		}

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 40, averageDamage: 75, maxDamage: 155};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				Math.min(sender.getAttack(), 500), // Cap at 500 to avoid too much damage
				receiver.getAttack()
			], defenderStats: [
				100,
				100
			], statsEffect: [
				0.5,
				0.5
			]
		};
	}
}