import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";

export default class QuickAttack extends FightAction {
	use(fightAction: FightAction, sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 10, sender.getSpeed() > receiver.getSpeed() ? 0 : 20);
		receiver.damage(damageDealt);

		return this.getGenericAttackOutput(damageDealt, initialDamage, language);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 25, averageDamage: 75, maxDamage: 180};
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
				0.5,
				0.5
			]
		};
	}
}