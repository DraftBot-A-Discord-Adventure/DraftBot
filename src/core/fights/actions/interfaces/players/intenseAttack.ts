import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {FightActions} from "../../FightActions";

export default class IntenseAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.level, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 5, 10);

		// the sender has to rest for 1 turn
		sender.nextFightAction = FightActions.getFightActionById("resting");

		// this attack cannot kill the receiver
		receiver.damage(damageDealt, true);

		return this.getGenericAttackOutput(damageDealt, initialDamage, language);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 25, averageDamage: 175, maxDamage: 275};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack(),
				350 - sender.getSpeed()
			], defenderStats: [
				receiver.getDefense() * 2,
				350 - receiver.getSpeed()
			], statsEffect: [
				0.8,
				0.2
			]
		};
	}
}