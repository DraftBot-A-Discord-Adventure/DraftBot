import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {format} from "../../../utils/StringFormatter";
import {FightActionController} from "../FightActionController";
import {FightConstants} from "../../../constants/FightConstants";
import {FightController} from "../../FightController";
import {PlayerFighter} from "../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../FightAction";

export default class Benediction extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// check the amount of ultimate attacks the sender already used
		const usedGodMoovs = FightController.getUsedGodMoves(sender, receiver);

		// 1 god move per fight
		if (usedGodMoovs >= 1) {
			return attackTranslationModule.format("actions.attacksResults.maxUses", {
				attack: Translations.getModule(`fightactions.${this.name}`, language)
					.get("name")
					.toLowerCase()
			});
		}

		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 10);

		receiver.stats.fightPoints -= damageDealt;
		let sideEffects = "";
		const buff = turn < 15 ? Math.round(1.67 * turn) : 25;

		sender.stats.defense = Math.round(sender.stats.defense + sender.stats.defense * buff / 100);
		sideEffects += attackTranslationModule.format("actions.sideEffects.defense", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: buff
		});
		sender.stats.attack = Math.round(sender.stats.attack + sender.stats.attack * buff / 100);
		sideEffects += attackTranslationModule.format("actions.sideEffects.attack", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: buff
		});
		sender.stats.speed = Math.round(sender.stats.speed - sender.stats.speed * buff / 100);
		sideEffects += attackTranslationModule.format("actions.sideEffects.speed", {
			adversary: FightConstants.TARGET.SELF,
			operator: FightConstants.OPERATOR.PLUS,
			amount: buff
		});


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
		return {minDamage: 55, averageDamage: 100, maxDamage: 200};
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