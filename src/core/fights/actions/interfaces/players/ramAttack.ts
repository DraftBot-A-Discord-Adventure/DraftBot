import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";

export default class RamAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		let damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 25);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		// 70% chance to stun the defender
		if (Math.random() < 0.70) {
			const alteration = receiver.newAlteration(FightAlterations.STUNNED);
			if (alteration === FightAlterations.STUNNED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.OPPONENT,
					effect: attackTranslationModule.get("effects.stunned").toLowerCase()
				});
			}
		}

		// Sender has a 25% chance to be stunned and 75% chance to be hurt by his own attack
		if (Math.random() < 0.25) {
			const alteration = sender.newAlteration(FightAlterations.STUNNED);
			if (alteration === FightAlterations.STUNNED) {
				sideEffects += attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.SELF,
					effect: attackTranslationModule.get("effects.stunned").toLowerCase()
				});
			}
		}
		else {
			const ownDamage = Math.round(damageDealt * 0.45);
			sender.damage(ownDamage);
			sideEffects += attackTranslationModule.format("actions.sideEffects.damage", {
				amount: ownDamage
			});
		}

		damageDealt = Math.round(damageDealt);
		receiver.damage(damageDealt);

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 60, averageDamage: 110, maxDamage: 210};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getDefense(),
				sender.getSpeed()
			], defenderStats: [
				receiver.getDefense(),
				receiver.getSpeed()
			], statsEffect: [
				0.85,
				0.15
			]
		};
	}
}