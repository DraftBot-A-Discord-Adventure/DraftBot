import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {FightController} from "../../../FightController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";

export default class Benediction extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// check the amount of ultimate attacks the sender already used
		// 1 god move per fight
		if (FightController.getUsedGodMoves(sender, receiver) >= 1) {
			return attackTranslationModule.format("actions.attacksResults.maxUses", {
				attack: Translations.getModule(`fightactions.${this.name}`, language)
					.get("name")
					.toLowerCase()
			});
		}

		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 10);

		receiver.damage(damageDealt);
		let sideEffects = "";
		const buff = turn < 15 ? Math.round(1.67 * turn) : 25;

		sender.applyDefenseModifier({
			origin: this,
			operation: FightStatModifierOperation.ADDITION,
			value: sender.getDefense() * buff / 100
		});
		sideEffects += attackTranslationModule.format("actions.sideEffects.defense", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: buff
		});
		sender.applyAttackModifier({
			origin: this,
			operation: FightStatModifierOperation.ADDITION,
			value: sender.getAttack() * buff / 100
		});
		sideEffects += attackTranslationModule.format("actions.sideEffects.attack", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: buff
		});
		sender.applySpeedModifier({
			origin: this,
			operation: FightStatModifierOperation.ADDITION,
			value: sender.getSpeed() * buff / 100
		});
		sideEffects += attackTranslationModule.format("actions.sideEffects.speed", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: buff
		});

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 55, averageDamage: 100, maxDamage: 200};
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