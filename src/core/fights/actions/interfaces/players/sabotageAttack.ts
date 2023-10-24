import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {FightConstants} from "../../../../constants/FightConstants";
import {Translations} from "../../../../Translations";

export default class SabotageAttack extends FightAction {
	use(fightAction: FightAction, sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const attackTranslationModule = Translations.getModule("commands.fight", language);
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 15, 5);
		receiver.damage(damageDealt);

		let sideEffects = "";

		if (Math.random() < 0.9) {
			const alteration = sender.newAlteration(FightAlterations.PARALYZED);
			if (alteration === FightAlterations.PARALYZED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.SELF,
					effect: attackTranslationModule.get("effects.paralyzed").toLowerCase()
				});
			}
		}

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 55, averageDamage: 80, maxDamage: 160};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack(),
				sender.getSpeed()
			], defenderStats: [
				receiver.getAttack(),
				receiver.getSpeed()
			], statsEffect: [
				0.75,
				0.25
			]
		};
	}
}