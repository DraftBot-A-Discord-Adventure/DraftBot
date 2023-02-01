import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {format} from "../../../../utils/StringFormatter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightActionType} from "../../FightActionType";
import {FightAlterations} from "../../FightAlterations";
import {FightConstants} from "../../../../constants/FightConstants";
import {RandomUtils} from "../../../../utils/RandomUtils";

export default class GrabAndThrowAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		if (receiver.getLastFightActionUsed()?.getType() === FightActionType.PHYSICAL) {
			// Calculate damages
			const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.level, this.getAttackInfo());
			const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 10, 10);

			// Message variables
			const attackTranslationModule = Translations.getModule("commands.fight", language);
			let sideEffects = "";

			// the receiver has a 50% chance to be stunned
			if (RandomUtils.draftbotRandom.bool()) {
				const alteration = receiver.newAlteration(FightAlterations.STUNNED);
				if (alteration === FightAlterations.STUNNED) {
					sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
						adversary: FightConstants.TARGET.OPPONENT,
						effect: attackTranslationModule.get("effects.stunned").toLowerCase()
					});
				}
			}

			// Deal damages
			receiver.damage(damageDealt);

			// Action message
			const attackStatus = this.getAttackStatus(damageDealt, initialDamage);
			const chosenString = attackTranslationModule.getRandom(`actions.attacksResults.${attackStatus}`);
			return format(chosenString, {
				attack: Translations.getModule(`fightactions.${this.name}`, language)
					.get("name")
					.toLowerCase()
			}) + sideEffects + Translations.getModule("commands.fight", language).format("actions.damages", {
				damages: damageDealt
			});
		}

		return Translations.getModule(`fightactions.${this.name}`, language).get("fail");
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 70, averageDamage: 90, maxDamage: 100};
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