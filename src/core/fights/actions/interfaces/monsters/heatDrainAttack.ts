import {Fighter, FightStatModifierOperation} from "../../../fighter/Fighter";
import {FightAction} from "../../FightAction";
import {Translations} from "../../../../Translations";
import {FightAlterations} from "../../FightAlterations";
import {FightConstants} from "../../../../constants/FightConstants";

export default class HeatDrainAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		// Drain de chaleur : récupère la chaleur du joueur ce qui augmente l'attaque de l'attaquant et applique l'effet gelé au joueur
		const heatDrainTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		const attackTranslationModule = Translations.getModule("commands.fight", language);

		const attackIncrease = 20;
		sender.applyAttackModifier({
			origin: this,
			operation: FightStatModifierOperation.MULTIPLIER,
			value: 1 + attackIncrease / 100
		});

		const alteration = receiver.newAlteration(FightAlterations.FROZEN);
		let sideEffects = "";
		if (alteration === FightAlterations.FROZEN) {
			sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.SELF,
				effect: attackTranslationModule.get("effects.frozen").toLowerCase()
			});
		}
		return heatDrainTranslationModule.get("active") + sideEffects;
	}
}