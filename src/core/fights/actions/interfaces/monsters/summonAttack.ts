import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {Translations} from "../../../../Translations";
import {FightActionController} from "../../FightActionController";
import {RandomUtils} from "../../../../utils/RandomUtils";

export default class SummonAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const summonAttackTranslations = Translations.getModule(`fightactions.${this.name}`, language);
		const attackTranslationModule = Translations.getModule("commands.fight", language);

		// fail if already used
		if (sender.fightActionsHistory.filter((attack) => attack instanceof SummonAttack).length !== 0) {
			return summonAttackTranslations.get("fail");
		}

		const alliesCount = RandomUtils.randInt(2, 6); // Number of summoned allies
		const sideEffects = attackTranslationModule.format("actions.sideEffects.summoning", {
			amount: alliesCount
		});

		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.level, this.getAttackInfo()) * alliesCount;
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 10);
		receiver.damage(damageDealt);

		return this.getGenericAttackOutput(damageDealt, initialDamage, language, sideEffects);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 25, averageDamage: 90, maxDamage: 150};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack(),
				sender.getSpeed()
			], defenderStats: [
				receiver.getDefense(),
				receiver.getSpeed()
			], statsEffect: [
				0.8,
				0.2
			]
		};
	}
}