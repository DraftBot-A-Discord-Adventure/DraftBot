import {IFightAction} from "../IFightAction";
import {Fighter} from "../../fights/Fighter";
import {Translations} from "../../Translations";
import {Data} from "../../Data";
import {FighterAlterationId} from "../../fights/FighterAlterationId";
import {FightConstants} from "../../constants/FightConstants";

export const fightActionInterface: Partial<IFightAction> = {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {

		const attackTranslationModule = Translations.getModule("commands.fight", language);
		const concentrationTranslationModule = Translations.getModule(`fightactions.${this.getName()}`, language);
		const alteration = sender.newAlteration(FighterAlterationId.CONCENTRATED);

		if (alteration === FighterAlterationId.CONCENTRATED) {
			return concentrationTranslationModule.get("active") + attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.SELF,
				effect: attackTranslationModule.get("effects.concentrated").toLowerCase()
			});
		}
		return concentrationTranslationModule.get("fail");
	},

	toString(language: string): string {
		return Translations.getModule(`fightactions.${this.getName()}`, language).get("name");
	},

	getEmoji(): string {
		return Data.getModule(`fightactions.${this.getName()}`).getString("emote");
	},

	getName(): string {
		return "concentration";
	}
};