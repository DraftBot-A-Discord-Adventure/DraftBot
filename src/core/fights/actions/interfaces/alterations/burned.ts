import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {format} from "../../../../utils/StringFormatter";
import {FightActionController} from "../../FightActionController";
import {PlayerFighter} from "../../../fighter/PlayerFighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlteration} from "../../FightAlteration";

export default class BurnedAlteration extends FightAlteration {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const poisonTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		// 60 % chance to be healed from the poison (except for the first two turns)
		if (Math.random() < 0.6 && sender.alterationTurn > 1) {
			sender.removeAlteration();
			return poisonTranslationModule.get("heal");
		}
		const damageDealt = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		sender.stats.fightPoints -= damageDealt;
		return format(poisonTranslationModule.get("damage"), {damages: damageDealt});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 5, averageDamage: 50, maxDamage: 65};
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