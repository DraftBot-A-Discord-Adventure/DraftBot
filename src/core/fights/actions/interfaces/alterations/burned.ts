import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {format} from "../../../../utils/StringFormatter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlteration} from "../../FightAlteration";
import {RandomUtils} from "../../../../utils/RandomUtils";

export default class BurnedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const burnedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		// 60 % chance to be healed from the poison (except for the first two turns)
		if (RandomUtils.draftbotRandom.realZeroToOneInclusive() < 0.6 && victim.alterationTurn > 1) {
			victim.removeAlteration();
			return burnedTranslationModule.get("heal");
		}
		const damageDealt = FightActionController.getAttackDamage(this.getStatsInfo(victim, sender), victim, this.getAttackInfo(), true);
		victim.damage(damageDealt);
		return format(burnedTranslationModule.get("damage"), {damages: damageDealt});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 5, averageDamage: 50, maxDamage: 65};
	}

	getStatsInfo(victim: Fighter, sender: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack()
			], defenderStats: [
				victim.getDefense() / 4
			], statsEffect: [
				1
			]
		};
	}
}