import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {format} from "../../../utils/StringFormatter";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../../constants/FightConstants";
import {PlayerFighter} from "../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../FightAction";
import {FightAlterations} from "../FightAlterations";
import {RandomUtils} from "../../../utils/RandomUtils";

export default class FireAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 20, 20);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		if (RandomUtils.draftbotRandom.bool(0.8)) {
			const alteration = receiver.newAlteration(FightAlterations.BURNED);
			if (alteration === FightAlterations.BURNED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.OPPONENT,
					effect: attackTranslationModule.get("effects.burned").toLowerCase()
				});
			}
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
		return {minDamage: 15, averageDamage: 100, maxDamage: 130};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.attack
			], defenderStats: [
				receiver.stats.defense / 4
			], statsEffect: [
				1
			]
		};
	}
}