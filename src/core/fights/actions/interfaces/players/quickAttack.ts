import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";

const use: FightActionFunc = (_fight, _fightAction, sender, receiver) => {
	return simpleDamageFightAction(
		{sender, receiver},
		{critical: 10, failure: sender.getSpeed() > receiver.getSpeed() ? 0 : 20},
		{attackInfo: getAttackInfo(), statsInfo: getStatsInfo(sender, receiver)}
	);
};

export default use;

function getAttackInfo(): attackInfo {
	return {minDamage: 25, averageDamage: 75, maxDamage: 180};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
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
