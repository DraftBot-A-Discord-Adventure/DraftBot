import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/Fighter";
import {Translations} from "../../Translations";
import {Data} from "../../Data";
import {FighterAlterationId} from "../../fights/FighterAlterationId";
import {FightConstants} from "../../constants/FightConstants";

export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const healTranslationModule = Translations.getModule("fightactions." + this.getName(), language);
		const attackTranslationModule = Translations.getModule("commands.fight", language);
		let sideEffects = "";
		const alteration = sender.newAlteration(FighterAlterationId.PROTECTED);
		if (alteration === FighterAlterationId.PROTECTED) {
			sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.SELF,
				effect: attackTranslationModule.get("effects.protected").toLowerCase()
			});
			return healTranslationModule.get("active") + sideEffects;
		}
		if (alteration === FighterAlterationId.POISONED || alteration === FighterAlterationId.CONFUSED || alteration === FighterAlterationId.STUNNED) {
			sender.forceAlteration(FighterAlterationId.PROTECTED);
			sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.SELF,
				effect: attackTranslationModule.get("effects.protected").toLowerCase()
			});
			return healTranslationModule.get("active") + sideEffects;
		}
		return healTranslationModule.get("fail") + sideEffects;

	},

	toString(language: string):
		string {
		return Translations.getModule(`fightactions.${this.getName()}`, language).get("name");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "heal";
	}
};