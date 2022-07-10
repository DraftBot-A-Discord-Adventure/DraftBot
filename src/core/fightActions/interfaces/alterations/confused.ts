import {IFightAction} from "../../IFightAction";
import {Fighter} from "../../../fights/Fighter";
import {Translations} from "../../../Translations";
import {Data} from "../../../Data";
import {FightActionController} from "../../FightActionController";
import {FighterAlterationId} from "../../../fights/FighterAlterationId";
import {FightConstants} from "../../../constants/FightConstants";

type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };
type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		sender.alterationTurn++;
		const randomValue = Math.random();

		const confusionTranslationModule = Translations.getModule("fightactions." + this.getName(), language);

		// 35 % to be healed of the confusion (except for the first turn)
		if (randomValue < 0.35 && sender.alterationTurn > 1) {
			sender.newAlteration(FighterAlterationId.NORMAL);
			return confusionTranslationModule.get("heal");
		}

		// 35 % chance that the confusion select a random action
		if (randomValue < 0.70) {
			sender.nextFightActionId = sender.getRandomAvailableFightActionId();
			return confusionTranslationModule.get("randomAction");
		}

		// 15 % chance that the confusion hurt the sender
		if (randomValue < 0.85) {
			const damageDealt = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.getPlayerLevel(), this.getAttackInfo());
			sender.nextFightActionId = FightConstants.ACTION_ID.NO_MOVE;
			sender.stats.fightPoints -= damageDealt;
			return confusionTranslationModule.format("damage", {damages: damageDealt});
		}

		return confusionTranslationModule.get("active");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "confused";
	},

	getAttackInfo(): attackInfo {
		return {minDamage: 5, averageDamage: 15, maxDamage: 35};
	},

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				receiver.stats.attack,
				sender.stats.attack
			], defenderStats: [
				100,
				100
			], statsEffect: [
				0.8,
				0.2
			]
		};
	}
};