import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {FightConstants} from "../../../../constants/FightConstants";
import {Translations} from "../../../../Translations";

export default class LavaWaveAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 10, 5);
		receiver.damage(damageDealt);

		const attackTranslationModule = Translations.getModule("commands.fight", language);
		const lavaWaveTranslationModule = Translations.getModule(`fightactions.${this.name}`, language);
		let sideEffects = "";

		const alteration = receiver.newAlteration(FightAlterations.BURNED);
		if (alteration === FightAlterations.BURNED) {
			sideEffects = attackTranslationModule.format("actions.sideEffects.newAlteration", {
				adversary: FightConstants.TARGET.OPPONENT,
				effect: attackTranslationModule.get("effects.burned").toLowerCase()
			});
		}

		return lavaWaveTranslationModule.format("active",
			{
				damages: damageDealt
			}
		) + sideEffects;
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 125, averageDamage: 230, maxDamage: 310};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack()
			], defenderStats: [
				receiver.getDefense()
			], statsEffect: [
				1
			]
		};
	}
}