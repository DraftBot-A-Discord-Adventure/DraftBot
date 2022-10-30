import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {format} from "../../../utils/StringFormatter";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../../constants/FightConstants";
import {FightController} from "../../FightController";
import {PlayerFighter} from "../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../FightAction";
import {FightAlterations} from "../FightAlterations";

export default class DivineAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// check the amount of ultimate attacks the sender already used
		const usedGodMoves = FightController.getUsedGodMoves(sender, receiver);

		// only works if less than 2 god moves have been used
		if (usedGodMoves >= 2) {
			return attackTranslationModule.format("actions.attacksResults.maxUses", {
				attack: Translations.getModule(`fightactions.${this.name}`, language)
					.get("name")
					.toLowerCase()
			});
		}

		let sideEffects = "";

		if (Math.random() < 0.2) {
			const alteration = receiver.newAlteration(FightAlterations.CONFUSED);
			if (alteration === FightAlterations.CONFUSED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.OPPONENT,
					effect: attackTranslationModule.get("effects.confused").toLowerCase()
				});
			}
		}

		const failureProbability = Math.round(95 - turn * 7 < 10 ? 10 : 95 - turn * 7);


		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, failureProbability);

		receiver.stats.fightPoints -= damageDealt;

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

	getAttackInfo(): attackInfo {
		return {minDamage: 75, averageDamage: 220, maxDamage: 360};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.attack,
				sender.stats.speed
			], defenderStats: [
				receiver.stats.defense,
				receiver.stats.speed
			], statsEffect: [
				0.7,
				0.3
			]
		};
	}
}