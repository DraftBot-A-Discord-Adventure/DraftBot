import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {format} from "../../../utils/StringFormatter";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../../constants/FightConstants";
import {PlayerFighter} from "../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../FightAction";

export default class ChargeChargingAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());

		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 1, 1);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// Increase defense of the sender by 50 %
		const increaseAmount = 50;
		sender.stats.defense = Math.round(sender.stats.defense + sender.stats.defense * increaseAmount / 100);
		const sideEffects = attackTranslationModule.format("actions.sideEffects.defense", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: increaseAmount
		});

		sender.nextFightAction = this;

		receiver.stats.fightPoints -= damageDealt;

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
		return {minDamage: 15, averageDamage: 60, maxDamage: 100};
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