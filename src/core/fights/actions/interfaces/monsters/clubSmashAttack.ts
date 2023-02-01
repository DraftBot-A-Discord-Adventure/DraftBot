import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";

export default class ClubSmashAttack extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender.level, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 10, 10);
		receiver.damage(damageDealt);
		return this.getGenericAttackOutput(damageDealt, initialDamage, language);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 120, averageDamage: 150, maxDamage: 160};
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