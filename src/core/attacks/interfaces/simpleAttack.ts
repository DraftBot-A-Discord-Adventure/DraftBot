import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/Fighter";
import {Translations} from "../../Translations";
import {format} from "../../utils/StringFormatter";
import {Data} from "../../Data";
import {FightActionController} from "../FightActionController";

type attackInfo = { minDamage: number, averageDamage: number, maxDamage: number };

export const fightActionInterface: IFightAction = {
	use(sender: Fighter, receiver: Fighter, language: string): string {
		const damageDealt = FightActionController.getAttackDamage(sender.stats.attack, receiver.stats.defense, this.getAttackInfo());
		receiver.stats.fightPoints -= damageDealt;
		receiver.stats.fightPoints = receiver.stats.fightPoints > 0 ? receiver.stats.fightPoints : 0;
		const attackTranslationModule = Translations.getModule("commands.fight", language);
		const retStr = damageDealt >= Math.round(sender.stats.attack / 4)
			? "succeed"
			: damageDealt === 0
				? "failed"
				: "notGood";
		const chosenString = attackTranslationModule.getRandom(`actions.attacksResults.${retStr}`);
		return format(chosenString, {
			attack: Translations.getModule("fightactions.simpleAttack", language).get("name")
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
		return "simpleAttack";
	},

	getAttackInfo(): attackInfo {
		return {minDamage: 50, averageDamage: 100, maxDamage: 150};
	}
};