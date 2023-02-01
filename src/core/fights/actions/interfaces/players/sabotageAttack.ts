import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";

export default class SabotageAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.level, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 15, 5);
		receiver.damage(damageDealt);

		return this.getGenericAttackOutput(damageDealt, initialDamage, language);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 60, averageDamage: 85, maxDamage: 170};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack(),
				sender.getSpeed()
			], defenderStats: [
				receiver.getAttack(),
				receiver.getSpeed()
			], statsEffect: [
				0.75,
				0.25
			]
		};
	}
}