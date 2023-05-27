import {Fighter} from "../../../fighter/Fighter";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {RandomUtils} from "../../../../utils/RandomUtils";
import {FightWeather} from "../../../FightWeather";

export default class FireAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string, weather: FightWeather): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 20, 20);

		const attackTranslationModule = Translations.getModule("commands.fight", language);

		let sideEffects = "";

		if (RandomUtils.draftbotRandom.bool(0.8)) {
			const alteration = receiver.newAlteration(FightAlterations.BURNED);
			if (alteration === FightAlterations.BURNED) {
				sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
					adversary: FightConstants.TARGET.OPPONENT,
					effect: attackTranslationModule.get("effects.burned").toLowerCase()
				});
			}
		}

		receiver.damage(damageDealt);

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 15, averageDamage: 100, maxDamage: 130};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack()
			], defenderStats: [
				receiver.getDefense() / 4
			], statsEffect: [
				1
			]
		};
	}
}