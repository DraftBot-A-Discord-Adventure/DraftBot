import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {format} from "../../../../utils/StringFormatter";
import {FightActionController} from "../../FightActionController";
import {PlayerFighter} from "../../../fighter/PlayerFighter";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";

export default class PoisonedAlteration extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const poisonTranslationModule = Translations.getModule("fightactions." + this.name, language);
		// 35 % chance to be healed from the poison (except for the first turn)
		if (Math.random() < 0.35 && sender.alterationTurn > 1) {
			sender.removeAlteration();
			return poisonTranslationModule.get("heal");
		}
		const damageDealt = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		sender.stats.fightPoints -= damageDealt;
		return format(poisonTranslationModule.get("damage"), {damages: damageDealt});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 10, averageDamage: 25, maxDamage: 45};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				receiver.stats.attack,// we use the defender's attack because the poison is applied to the attacker
				sender.stats.attack,
				receiver.stats.fightPoints
			], defenderStats: [
				100,
				100,
				receiver.stats.maxFightPoint
			], statsEffect: [
				0.5,
				0.1,
				0.4
			]
		};
	}
}