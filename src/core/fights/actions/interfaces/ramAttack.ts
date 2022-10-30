import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {format} from "../../../utils/StringFormatter";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../../constants/FightConstants";
import {PlayerFighter} from "../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../FightAction";
import {FightAlterations} from "../FightAlterations";

export default class RamAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		let damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 25);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		// 50% chance to stun the defender
		if (Math.random() < 0.50) {
			const alteration = receiver.newAlteration(FightAlterations.STUNNED);
			if (alteration === FightAlterations.STUNNED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.OPPONENT,
					effect: attackTranslationModule.get("effects.stunned").toLowerCase()
				});
			}
		}

		// sender has a 25% chance to be stunned and 75% chance to be hurt by his own attack
		if (Math.random() < 0.25) {
			const alteration = sender.newAlteration(FightAlterations.STUNNED);
			if (alteration === FightAlterations.STUNNED) {
				sideEffects += attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.SELF,
					effect: attackTranslationModule.get("effects.stunned").toLowerCase()
				});
			}
		}
		else {
			const ownDamage = Math.round(damageDealt * 0.33);
			sender.stats.fightPoints -= ownDamage;
			sideEffects += attackTranslationModule.format("actions.sideEffects.damage", {
				amount: ownDamage
			});
		}

		damageDealt = Math.round(damageDealt);
		receiver.stats.fightPoints -= damageDealt;

		return format(attackTranslationModule.getRandom(`actions.attacksResults.${this.getAttackStatus(damageDealt, initialDamage)}`), {
			attack: Translations.getModule(`fightactions.${this.name}`, language)
				.get("name")
				.toLowerCase()
		}) + sideEffects + Translations.getModule("commands.fight", language).format("actions.damages", {
			damages: damageDealt
		});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 60, averageDamage: 125, maxDamage: 250};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.defense,
				sender.stats.speed
			], defenderStats: [
				receiver.stats.defense,
				receiver.stats.speed
			], statsEffect: [
				0.85,
				0.15
			]
		};
	}
}