import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import Benediction from "./benediction";

export default class DivineAttack extends FightAction {
	static getUsedGodMoves(sender: Fighter, receiver: Fighter): number {
		return sender.fightActionsHistory.filter(action => action instanceof Benediction ||
				action instanceof DivineAttack).length
			+ receiver.fightActionsHistory.filter(action =>
				action instanceof Benediction ||
				action instanceof DivineAttack).length;
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 75, averageDamage: 220, maxDamage: 360};
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

	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// Check the amount of ultimate attacks the sender already used
		const usedGodMoves = DivineAttack.getUsedGodMoves(sender, receiver);

		// Only works if less than 2 god moves have been used
		if (usedGodMoves >= 2) {
			return attackTranslationModule.format("actions.attacksResults.maxUses", {
				attack: Translations.getModule(`fightactions.${this.name}`, language)
					.get("name")
					.toLowerCase()
			});
		}

		let sideEffects = "";

		if (Math.random() < 0.2) {
			const alteration = receiver.newAlteration(FightAlterations.PARALYZED);
			if (alteration === FightAlterations.PARALYZED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.OPPONENT,
					effect: attackTranslationModule.get("effects.paralyzed").toLowerCase()
				});
			}
		}

		const failureProbability = Math.round(95 - turn * 7 < 10 ? 10 : 95 - turn * 7);

		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 0, failureProbability);

		receiver.damage(damageDealt);

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}
}