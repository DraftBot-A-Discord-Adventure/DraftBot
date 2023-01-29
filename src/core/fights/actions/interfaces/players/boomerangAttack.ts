import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {format} from "../../../../utils/StringFormatter";
import {FightActionController} from "../../FightActionController";
import {PlayerFighter} from "../../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {FightConstants} from "../../../../constants/FightConstants";

export default class BoomerangAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), receiver.level, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 15, 20);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		const alteration = receiver.newAlteration(FightAlterations.TARGETED);
		if (alteration === FightAlterations.TARGETED) {
			sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.OPPONENT,
				effect: attackTranslationModule.get("effects.targeted").toLowerCase()
			});
		}

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
		return {minDamage: 45, averageDamage: 90, maxDamage: 150};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.attack
			], defenderStats: [
				receiver.stats.defense
			], statsEffect: [
				1
			]
		};
	}
}