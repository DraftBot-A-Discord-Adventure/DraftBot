import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {format} from "../../../../utils/StringFormatter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlteration} from "../../FightAlteration";
import {RandomUtils} from "../../../../utils/RandomUtils";

export default class PoisonedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const poisonTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		// 25 % chance to be healed from the poison (except for the first turn)
		if (RandomUtils.draftbotRandom.realZeroToOneInclusive() < 0.25 && victim.alterationTurn > 1) {
			victim.removeAlteration();
			return poisonTranslationModule.get("heal");
		}
		const damageDealt = FightActionController.getAttackDamage(this.getStatsInfo(victim, sender), sender, this.getAttackInfo(), true);
		victim.damage(damageDealt);
		return format(poisonTranslationModule.get("damage"), {damages: damageDealt});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 10, averageDamage: 25, maxDamage: 45};
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getStatsInfo(victim: Fighter, sender: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack()
			], defenderStats: [
				0
			], statsEffect: [
				1
			]
		};
	}
}