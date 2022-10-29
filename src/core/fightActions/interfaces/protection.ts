import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/fighter/Fighter";
import {Translations} from "../../Translations";
import {Data} from "../../Data";
import {FighterAlterationId} from "../../fights/FighterAlterationId";
import {FightConstants} from "../../constants/FightConstants";

export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const protectionTranslationModule = Translations.getModule(`fightactions.${this.getName()}`, language);
		const attackTranslationModule = Translations.getModule("commands.fight", language);
		const alteration = sender.newAlteration(FighterAlterationId.PROTECTED);
		if (alteration === FighterAlterationId.PROTECTED) {
			return protectionTranslationModule.get("active")
				+ attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.SELF,
					effect: attackTranslationModule.get("effects.protected").toLowerCase()
				});
		}
		return protectionTranslationModule.get("fail");
	},

	toString(language: string):
		string {
		return Translations.getModule(`fightactions.${this.getName()}`, language).get("name");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "protection";
	}
};