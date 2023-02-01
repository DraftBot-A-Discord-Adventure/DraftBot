import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {format} from "../../../../utils/StringFormatter";
import {FightActionController} from "../../FightActionController";
import {PlayerFighter} from "../../../fighter/PlayerFighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlteration} from "../../FightAlteration";
import {RandomUtils} from "../../../../utils/RandomUtils";

export default class TargetedAlteration extends FightAlteration {
	use(victim: Fighter, sender: Fighter, turn: number, language: string): string {
		victim.alterationTurn++;
		const targetedTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);

		if (victim.alterationTurn === 1) {
			return targetedTranslationModule.get("boomerangSpin");
		}

		if (victim.alterationTurn > 2 || RandomUtils.draftbotRandom.bool(0.2)) {
			victim.removeAlteration();
			return targetedTranslationModule.get("heal");
		}

		const damageDealt = FightActionController.getAttackDamage(this.getStatsInfo(victim, sender), victim.level, this.getAttackInfo());
		victim.damage(damageDealt);
		return format(targetedTranslationModule.get("damage"), {damages: damageDealt});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 45, averageDamage: 90, maxDamage: 150};
	}

	getStatsInfo(victim: Fighter, sender: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack()
			], defenderStats: [
				victim.getDefense()
			], statsEffect: [
				1
			]
		};
	}
}