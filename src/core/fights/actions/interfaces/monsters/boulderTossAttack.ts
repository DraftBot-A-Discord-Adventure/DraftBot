import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {FightConstants} from "../../../../constants/FightConstants";
import {Translations} from "../../../../Translations";
import {FightActionStatus} from "../../FightActionStatus";
import {FightWeather} from "../../../FightWeather";

export default class BoulderTossAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string, weather: FightWeather): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 0, 20);
		receiver.damage(damageDealt);

		const attackTranslationModule = Translations.getModule("commands.fight", language);
		let sideEffects = "";

		// 50% chance to stun the defender
		if (this.getAttackStatus(damageDealt, initialDamage) !== FightActionStatus.MISSED && Math.random() < 0.5) {
			const alteration = receiver.newAlteration(FightAlterations.STUNNED);
			if (alteration === FightAlterations.STUNNED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.OPPONENT,
					effect: attackTranslationModule.get("effects.stunned").toLowerCase()
				});
			}
		}

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 25, averageDamage: 90, maxDamage: 150};
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
				0.5,
				0.5
			]
		};
	}
}