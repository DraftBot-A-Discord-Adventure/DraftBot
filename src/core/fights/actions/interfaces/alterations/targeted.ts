import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {format} from "../../../../utils/StringFormatter";
import {FightActionController} from "../../FightActionController";
import {PlayerFighter} from "../../../fighter/PlayerFighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlteration} from "../../FightAlteration";
import {RandomUtils} from "../../../../utils/RandomUtils";

export default class TargetedAlteration extends FightAlteration {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const targetedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);

		if (sender.alterationTurn === 1) {
			return targetedTranslationModule.get("boomerangSpin");
		}

		if (sender.alterationTurn > 2 || RandomUtils.draftbotRandom.bool(0.2)) {
			sender.removeAlteration();
			return targetedTranslationModule.get("heal");
		}

		const damageDealt = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), (sender as PlayerFighter).getPlayerLevel(), this.getAttackInfo());
		sender.stats.fightPoints -= damageDealt;
		return format(targetedTranslationModule.get("damage"), {damages: damageDealt});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 45, averageDamage: 90, maxDamage: 150};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.stats.attack
			], defenderStats: [
				receiver.stats.defense
			], statsEffect: [
				1
			]
		};
	}
}