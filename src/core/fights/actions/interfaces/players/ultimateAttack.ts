import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {format} from "../../../../utils/StringFormatter";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";

export default class UltimateAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.level, this.getAttackInfo());

		let failureProbability = 70;
		// check if the sender has less than 45% of his fight points
		if (sender.getFightPoints() < sender.getMaxFightPoints() * 0.45) {
			failureProbability = 0;
		}

		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 20, failureProbability);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		const alteration = receiver.newAlteration(FightAlterations.SLOWED);
		if (alteration === FightAlterations.SLOWED) {
			sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.OPPONENT,
				effect: attackTranslationModule.get("effects.slowed").toLowerCase()
			});
		}
		receiver.damage(damageDealt);

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 100, averageDamage: 250, maxDamage: 350};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack(),
				sender.getSpeed() * 3
			], defenderStats: [
				receiver.getDefense(),
				receiver.getSpeed()
			], statsEffect: [
				0.7,
				0.3
			]
		};
	}
}