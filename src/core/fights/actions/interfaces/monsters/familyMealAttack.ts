import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightAlterations} from "../../FightAlterations";
import {FightConstants} from "../../../../constants/FightConstants";

export default class FamilyMealAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const familyMealTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		const attackTranslationModule = Translations.getModule("commands.fight", language);

		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo()) * 10;
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 0, 0);
		receiver.damage(damageDealt);

		let sideEffects = attackTranslationModule.format("actions.sideEffects.summoning", {
			amount: 10
		});

		const alteration = receiver.newAlteration(FightAlterations.POISONED);
		if (alteration === FightAlterations.POISONED) {
			sideEffects += attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.OPPONENT,
				effect: attackTranslationModule.get("effects.poisoned").toLowerCase()
			});
		}

		sender.removeAlteration();
		sender.newAlteration(FightAlterations.FULL);
		sideEffects += attackTranslationModule.format("actions.sideEffects.newAlteration", {
			adversary: FightConstants.TARGET.SELF,
			effect: attackTranslationModule.get("effects.full").toLowerCase()
		});

		return familyMealTranslationModule.get("active") + sideEffects + Translations.getModule("commands.fight", language).format("actions.damages", {
			damages: damageDealt
		});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 20, averageDamage: 30, maxDamage: 50};
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
				0.8,
				0.2
			]
		};
	}
}