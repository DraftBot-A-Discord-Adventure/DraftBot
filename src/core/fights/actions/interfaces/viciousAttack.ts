import {Fighter} from "../../fighter/Fighter";
import {Translations} from "../../../Translations";
import {format} from "../../../utils/StringFormatter";
import {FightActionController} from "../FightActionController";
import {PlayerFighter} from "../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../FightAction";

export default class ViciousAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		let damageDealt = FightActionController.applySecondaryEffects(initialDamage, 10, 10);

		// Plus l'attaque est utilisée et plus elle est utilisée tard et moins elle est efficace. (pénalité maximale de -70 %)
		const ratio = (11 - turn * (sender.fightActionsHistory.filter(action => action instanceof ViciousAttack).length + 1)) / 10;
		damageDealt = Math.round(ratio < 0.3 ? 0.3 * damageDealt : damageDealt * ratio);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		damageDealt = Math.round(damageDealt);
		receiver.stats.fightPoints -= damageDealt;

		return format(attackTranslationModule.getRandom(`actions.attacksResults.${this.getAttackStatus(damageDealt, initialDamage)}`), {
			attack: Translations.getModule("fightactions." + this.name, language)
				.get("name")
				.toLowerCase()
		}) + Translations.getModule("commands.fight", language).format("actions.damages", {
			damages: damageDealt
		});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 50, averageDamage: 200, maxDamage: 350};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				300,
				sender.stats.attack,
				sender.stats.speed
			], defenderStats: [
				sender.stats.fightPoints,
				receiver.stats.defense,
				receiver.stats.speed
			], statsEffect: [
				0.6,
				0.2,
				0.2
			]
		};
	}
}