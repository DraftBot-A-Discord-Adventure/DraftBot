import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {format} from "../../../utils/StringFormatter";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../../constants/FightConstants";
import {PlayerFighter} from "../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../FightAction";

export default class PiercingAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 10);

		receiver.stats.fightPoints -= damageDealt;

		let sideEffects = "";
		const attackTranslationModule = Translations.getModule("commands.fight", language);


		// 25% chance to lower the target's defense by 10%
		if (Math.random() < 0.25) {
			const reductionAmont = 10;
			receiver.stats.defense = Math.round(receiver.stats.defense - receiver.stats.defense * reductionAmont / 100);
			sideEffects = attackTranslationModule.format("actions.sideEffects.defense", {
				adversary: FightConstants.TARGET.OPPONENT,
				operator: FightConstants.OPERATOR.MINUS,
				amount: reductionAmont
			});
		}


		const attackStatus = this.getAttackStatus(damageDealt, initialDamage);
		const chosenString = attackTranslationModule.getRandom(`actions.attacksResults.${attackStatus}`);
		return format(chosenString, {
			attack: Translations.getModule("fightactions." + this.name, language)
				.get("name")
				.toLowerCase()
		}) + sideEffects + Translations.getModule("commands.fight", language).format("actions.damages", {
			damages: damageDealt
		});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 20, averageDamage: 80, maxDamage: 150};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.attack,
				sender.stats.speed
			], defenderStats: [
				receiver.stats.defense * 0.2,
				receiver.stats.speed
			], statsEffect: [
				0.8,
				0.2
			]
		};
	}
};