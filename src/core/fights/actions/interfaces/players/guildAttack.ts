import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {SimpleDamageFightActionTemplate} from "../../templates/SimpleDamageFightActionTemplate";
import {PlayerFighter} from "../../../fighter/PlayerFighter";

export default class SimpleAttack extends SimpleDamageFightActionTemplate {
	constructor(name: string) {
		super(name, 5, 0);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 110, averageDamage: 130, maxDamage: 250};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		let cumulatedAttack = sender.getAttack();
		let cumulatedSpeed = sender.getSpeed();
		for (const member of (sender as PlayerFighter).getPveMembersOnIsland()) {
			cumulatedAttack += member.attack;
			cumulatedSpeed += member.speed;
		}

		return {
			attackerStats: [
				cumulatedAttack,
				cumulatedSpeed
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