import {IFightAction} from "../../IFightAction";
import {Fighter} from "../../../fights/Fighter";
import {Translations} from "../../../Translations";
import {Data} from "../../../Data";
import {FighterAlterationId} from "../../../fights/FighterAlterationId";
import {FightConstants} from "../../../constants/FightConstants";

type statsInfo = { attackerStats: number[], defenderStats: number[], statsEffect: number[] }

export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, language: string): string {
		sender.alterationTurn++;
		const stunnedTranslationModule = Translations.getModule("fightactions." + this.getName(), language);
		if (sender.alterationTurn > 1) { // this effect heals after one turn
			sender.newAlteration(FighterAlterationId.NORMAL);
			return stunnedTranslationModule.get("inactive");
		}

		// 50% chance to not attack this turn
		if (Math.random() < 0.5) {
			sender.nextFightActionId = FightConstants.NO_MOVE_ACTION_ID;
			return stunnedTranslationModule.get("noAttack");
		}
		return stunnedTranslationModule.get("active");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "stunned";
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