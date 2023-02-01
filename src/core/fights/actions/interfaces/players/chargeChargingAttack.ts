import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightActions} from "../../FightActions";

export default class ChargeChargingAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.level, this.getAttackInfo());

		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 1, 1);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// Increase defense of the sender by 50 %
		const increaseAmount = 50;
		sender.applyDefenseModifier({
			origin: this,
			operation: FightStatModifierOperation.MULTIPLIER,
			value: 1 + increaseAmount / 100
		});
		const sideEffects = attackTranslationModule.format("actions.sideEffects.defense", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: increaseAmount
		});

		sender.nextFightAction = FightActions.getFightActionById("chargingAttack");

		receiver.damage(damageDealt);

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 15, averageDamage: 60, maxDamage: 100};
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