import {IFightAction} from "../IFightAction";
import {RandomUtils} from "../../utils/RandomUtils";
import {Fighter} from "../../fights/Fighter";
import {Translations} from "../../Translations";
import {format} from "../../utils/StringFormatter";
import {Data} from "../../Data";

export const fightActionInterface: IFightAction = {
	use(sender: Fighter, receiver: Fighter, language: string): string {
		const playerFightActionsHistory: Map<string, number> = sender.getFightActionCount();
		const success = RandomUtils.draftbotRandom.realZeroToOneInclusive();
		let powerChanger = 0.1;
		if (receiver.stats.speed > sender.stats.speed && success < 0.3) {
			powerChanger = 0.85;
			if (playerFightActionsHistory.get("quickAttack") > 1) {
				powerChanger -= playerFightActionsHistory.get("quickAttack") / 15;
			}
		}
		else if (receiver.stats.speed < sender.stats.speed && success < 0.98) {
			powerChanger = 0.85;
			if (playerFightActionsHistory.get("quickAttack") > 1) {
				powerChanger -= playerFightActionsHistory.get("quickAttack") / 11;
			}
		}
		const damageDealt = Math.round(sender.stats.attack * powerChanger - Math.round(receiver.stats.defense * 0.1));
		const attackTranslationModule = Translations.getModule("commands.fight", language);
		const retStr = damageDealt >= Math.round(sender.stats.attack / 4)
			? "succeed"
			: damageDealt === 0
				? "failed"
				: "notGood";
		const chosenString = attackTranslationModule.getRandom(`actions.attacksResults.${retStr}`);
		return format(chosenString, {
			attack: Translations.getModule("fightactions.quickAttack", language).get("name")
		}) + Translations.getModule("commands.fight", language).format("actions.damages", {
			damages: damageDealt
		});
	},

	toString(language: string): string {
		return Translations.getModule(`fightactions.${this.getName()}`, language).get("name");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "quickAttack";
	},

	getAttackInfo(): { minDamage: number, averageDamage: number, maxDamage: number } {
		return {minDamage: 50, averageDamage: 100, maxDamage: 150};
	}
};