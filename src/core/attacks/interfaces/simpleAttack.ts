import {IFightAction} from "../IFightAction";
import {RandomUtils} from "../../utils/RandomUtils";
import {Fighter} from "../../fights/Fighter";
import {Translations} from "../../Translations";
import {format} from "../../utils/StringFormatter";

export const fightActionInterface: IFightAction = {
	use(sender: Fighter, receiver: Fighter, language: string): string {
		const success = RandomUtils.draftbotRandom.realZeroToOneInclusive();
		let powerChanger = 0.4;
		if (receiver.stats.speed > sender.stats.speed && success <= 0.4 || receiver.stats.speed < sender.stats.speed && success < 0.9) {
			powerChanger = 1.2;
		}
		else if (receiver.stats.speed > sender.stats.speed && success <= 0.9) {
			powerChanger = 0.9;
		}
		let damageDealt = Math.round(sender.stats.attack * powerChanger - receiver.stats.defense);
		if (damageDealt < 0) {
			damageDealt = 0;
		}
		damageDealt += RandomUtils.randInt(1, Math.round(sender.stats.attack / 4) + 1);
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
			attack: Translations.getModule("fightaction.simpleAttack", language).get("name")
		});
	},

	toString(language: string): string {
		return Translations.getModule("fightaction.simpleAttack", language).get("name");
	}
};