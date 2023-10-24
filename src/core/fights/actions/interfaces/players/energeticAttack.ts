import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";

export default class EnergeticAttack extends FightAction {
	use(fightAction: FightAction, sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 35, 5);
		receiver.damage(damageDealt);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// Half of the damage is converted to fight points
		const healAmount = Math.round(damageDealt / 2);
		sender.heal(healAmount);
		const sideEffects = attackTranslationModule.format("actions.sideEffects.energy", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: healAmount
		});

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 30, averageDamage: 75, maxDamage: 115};
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
				0.75,
				0.25
			]
		};
	}
}