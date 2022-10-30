import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {format} from "../../../utils/StringFormatter";
import {FightActionController} from "../FightActionController";
import {PlayerFighter} from "../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../FightAction";
import {FightActions} from "../FightActions";

export default class IntenseAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 10);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// the sender has to rest for 1 turn
		sender.nextFightAction = FightActions.getFightActionById("resting");

		// this attack cannot kill the receiver
		receiver.stats.fightPoints = receiver.stats.fightPoints - damageDealt <= 0 ? 1 : receiver.stats.fightPoints - damageDealt;

		return format(attackTranslationModule.getRandom(`actions.attacksResults.${this.getAttackStatus(damageDealt, initialDamage)}`), {
			attack: Translations.getModule(`fightactions.${this.name}`, language)
				.get("name")
				.toLowerCase()
		}) + Translations.getModule("commands.fight", language).format("actions.damages", {
			damages: damageDealt
		});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 25, averageDamage: 175, maxDamage: 275};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.attack,
				350 - sender.stats.speed
			], defenderStats: [
				receiver.stats.defense * 2,
				350 - receiver.stats.speed
			], statsEffect: [
				0.8,
				0.2
			]
		};
	}
}