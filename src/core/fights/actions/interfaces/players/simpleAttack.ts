import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {SimpleDamageFightActionTemplate} from "../../templates/SimpleDamageFightActionTemplate";

export default class SimpleAttack extends SimpleDamageFightActionTemplate {
	constructor(name: string) {
		super(name, 5, 10);
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 25, averageDamage: 110, maxDamage: 160};
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