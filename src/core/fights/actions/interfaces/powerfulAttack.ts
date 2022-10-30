import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {format} from "../../../utils/StringFormatter";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../../constants/FightConstants";
import {PlayerFighter} from "../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../FightAction";
import {FightAlterations} from "../FightAlterations";

export default class PowerfulAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		let damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 20);

		// check how many times the attack appears in the fight action history of the sender
		const count = sender.fightActionsHistory.filter(action => action instanceof PowerfulAttack).length;

		// if the attack is repeated more than 3 times, the damage dealt is reduced by 70%
		damageDealt *= count > 3 ? 0.3 : 1;

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		// 20% chance to stun the sender and deal 50% more damage
		if (Math.random() < 0.2) {
			const alteration = sender.newAlteration(FightAlterations.STUNNED);
			if (alteration === FightAlterations.STUNNED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.SELF,
					effect: attackTranslationModule.get("effects.stunned").toLowerCase()
				});
				damageDealt *= 1.5;
			}
		}

		damageDealt = Math.round(damageDealt);
		receiver.stats.fightPoints -= damageDealt;

		// Reduce speed of the sender by 15 %
		const reductionAmont = 15;
		sender.stats.speed = Math.round(sender.stats.speed - sender.stats.speed * reductionAmont / 100);
		sideEffects += attackTranslationModule.format("actions.sideEffects.speed", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.MINUS,
			amount: reductionAmont
		});

		return format(attackTranslationModule.getRandom(`actions.attacksResults.${this.getAttackStatus(damageDealt, initialDamage)}`), {
			attack: Translations.getModule("fightactions." + this.name, language)
				.get("name")
				.toLowerCase()
		}) + sideEffects + Translations.getModule("commands.fight", language).format("actions.damages", {
			damages: damageDealt
		});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 50, averageDamage: 150, maxDamage: 250};
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