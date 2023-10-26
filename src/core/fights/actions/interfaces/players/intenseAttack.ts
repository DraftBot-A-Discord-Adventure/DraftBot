import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightActionDataController, FightActionFunc} from "@Core/src/data/FightAction";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";

const use: FightActionFunc = (_fight, _fightAction, sender, receiver) => {
	const result = simpleDamageFightAction(
		{sender, receiver},
		{critical: 5, failure: sender.getSpeed() < receiver.getSpeed() ? 0 : 10},
		{attackInfo: getAttackInfo(), statsInfo: getStatsInfo(sender, receiver)}
	);

	// This attack cannot kill the receiver
	if (result.damages >= receiver.getFightPoints()) {
		result.damages = receiver.getFightPoints() - 1;
	}

	// The sender has to rest for 1 turn
	sender.nextFightAction = FightActionDataController.instance.getById("resting");

	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {minDamage: 25, averageDamage: 175, maxDamage: 275};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
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