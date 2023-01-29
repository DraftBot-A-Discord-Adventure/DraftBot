import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {format} from "../../../../utils/StringFormatter";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {RandomUtils} from "../../../../utils/RandomUtils";

export default class DarkAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), receiver.level, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 40, 15);

		receiver.stats.fightPoints -= damageDealt;

		const attackTranslationModule = Translations.getModule("commands.fight", language);
		let sideEffects = "";

		if (RandomUtils.draftbotRandom.bool(0.65)) {
			const removedAttackPoints = Math.round(receiver.stats.attack * 0.15);
			receiver.stats.attack -= removedAttackPoints;
			sideEffects = attackTranslationModule.format("actions.sideEffects.attack", {
				adversary: FightConstants.TARGET.OPPONENT,
				operator: FightConstants.OPERATOR.MINUS,
				amount: 15
			});
		}


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
		return {minDamage: 40, averageDamage: 75, maxDamage: 155};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.attack,
				receiver.stats.attack
			], defenderStats: [
				0,
				0
			], statsEffect: [
				0.5,
				0.5
			]
		};
	}
}