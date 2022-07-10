import {IFightAction} from "../../IFightAction";
import {Fighter} from "../../../fights/Fighter";
import {Translations} from "../../../Translations";
import {format} from "../../../utils/StringFormatter";
import {Data} from "../../../Data";
import {FightActionController} from "../../FightActionController";
import {FighterAlterationId} from "../../../fights/FighterAlterationId";

type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };
type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const damageDealt = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.getPlayerLevel(), this.getAttackInfo());
		sender.stats.fightPoints -= damageDealt;
		const poisonTranslationModule = Translations.getModule("fightactions." + this.getName(), language);
		// 35 % chance to be healed from the poison (except for the first turn)
		if (Math.random() < 0.35 && sender.alterationTurn > 1) {
			sender.newAlteration(FighterAlterationId.NORMAL);
			return poisonTranslationModule.get("heal");
		}
		return format(poisonTranslationModule.get("damage"), {damages: damageDealt});
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "poisoned";
	},

	getAttackInfo(): attackInfo {
		return {minDamage: 10, averageDamage: 25, maxDamage: 45};
	},

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
};