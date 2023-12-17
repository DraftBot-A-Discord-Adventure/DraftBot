import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";

export default class ShieldAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 1);
		receiver.damage(damageDealt);

		const attackTranslationModule = Translations.getModule("commands.fight", language);
		let sideEffects = "";
		const alteration = receiver.newAlteration(FightAlterations.WEAK);

		if (alteration === FightAlterations.WEAK) {
			sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.OPPONENT,
				effect: attackTranslationModule.get("effects.weak").toLowerCase()
			});
		}

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 30, averageDamage: 80, maxDamage: 115};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getDefense(),
				sender.getAttack()
			], defenderStats: [
				receiver.getDefense(),
				receiver.getDefense()
			], statsEffect: [
				0.8,
				0.2
			]
		};
	}
}