import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {format} from "../../../utils/StringFormatter";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../../constants/FightConstants";
import {MathUtils} from "../../../utils/MathUtils";
import {PlayerFighter} from "../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../FightAction";
import {FightAlterations} from "../FightAlterations";

export default class CanonAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());

		// this attack will miss more if the opponent is fast
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 15, MathUtils.getIntervalValue(5, 35, (receiver.stats.speed + 20) / 320));

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		// the receiver has a 15% chance to be slowed
		if (Math.random() < 0.15) {
			const alteration = receiver.newAlteration(FightAlterations.SLOWED);
			if (alteration === FightAlterations.SLOWED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.OPPONENT,
					effect: attackTranslationModule.get("effects.slowed").toLowerCase()
				});
			}
		}

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
		return {minDamage: 20, averageDamage: 120, maxDamage: 250};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.attack,
				120
			], defenderStats: [
				receiver.stats.defense,
				receiver.stats.speed
			], statsEffect: [
				0.5,
				0.5
			]
		};
	}
}