import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";

export default class PoisonousAttack extends FightAction {
	use(fightAction: FightAction, sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 10);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		const alteration = receiver.newAlteration(FightAlterations.POISONED);
		if (alteration === FightAlterations.POISONED) {
			sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.OPPONENT,
				effect: attackTranslationModule.get("effects.poisoned").toLowerCase()
			});
		}

		receiver.damage(damageDealt);

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 15, averageDamage: 20, maxDamage: 40};
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