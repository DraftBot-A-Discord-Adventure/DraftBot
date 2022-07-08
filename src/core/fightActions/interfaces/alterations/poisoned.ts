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
		// 25 % de chance d'être soigné du poison
		if (Math.random() < 0.25 && sender.alterationTurn > 1) {
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
		return {minDamage: 20, averageDamage: 30, maxDamage: 40};
	},

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				receiver.stats.attack // we use the defender's attack because the poison is applied to the attacker
			], defenderStats: [
				0 // poison is not affected by defense
			], statsEffect: [
				1
			]
		};
	}
};