import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {SimpleDamageFightActionTemplate} from "../../templates/SimpleDamageFightActionTemplate";

export default class ClubSmashAttack extends SimpleDamageFightActionTemplate {
	fightAction: FightAction,
	constructor(name: string) {
		super(name, 10, 10);
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