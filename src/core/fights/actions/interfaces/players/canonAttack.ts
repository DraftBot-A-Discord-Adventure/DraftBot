import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {MathUtils} from "../../../../utils/MathUtils";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";

export default class CanonAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.level, this.getAttackInfo());

		// this attack will miss more if the opponent is fast
		let damageDealt = FightActionController.applySecondaryEffects(initialDamage, 15, MathUtils.getIntervalValue(5, 35, (receiver.getSpeed() + 20) / 320));

		// if the attack was used two times in a row, the damage is divided by 2
		const lastFightAction = sender.getLastFightActionUsed();
		if (lastFightAction instanceof CanonAttack) {
			damageDealt = Math.round(damageDealt / 2);
		}

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		// the receiver has a 65% chance to be slowed
		if (Math.random() < 0.65) {
			const alteration = receiver.newAlteration(FightAlterations.SLOWED);
			if (alteration === FightAlterations.SLOWED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.OPPONENT,
					effect: attackTranslationModule.get("effects.slowed").toLowerCase()
				});
			}
		}

		receiver.damage(damageDealt);

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 20, averageDamage: 120, maxDamage: 250};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack(),
				120
			], defenderStats: [
				receiver.getDefense(),
				receiver.getSpeed()
			], statsEffect: [
				0.5,
				0.5
			]
		};
	}
}