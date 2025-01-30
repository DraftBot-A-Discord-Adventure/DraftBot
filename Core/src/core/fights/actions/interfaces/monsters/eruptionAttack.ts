import {FightActionFunc} from "../../../../../data/FightAction";
import {simpleDamageFightAction} from "../../templates/SimpleDamageFightActionTemplate";
import {attackInfo, FightActionController, statsInfo} from "../../FightActionController";
import {FightAlterations} from "../../FightAlterations";
import {Fighter} from "../../../fighter/Fighter";

const use: FightActionFunc = (sender, receiver, _fightAction) => {
	const speedRatio = receiver.getSpeed() / sender.getSpeed();
	const failureProbability = speedRatio < 3 ? 0 : 5 + Math.min(40, Math.pow(speedRatio - 3, 2) * 3);
	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 25,
			failure: failureProbability
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);

	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterations.BURNED
	}, receiver);
	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 50,
		averageDamage: 90,
		maxDamage: 170
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack()
		],
		defenderStats: [
			receiver.getSpeed()
		],
		statsEffect: [
			1
		]
	};
}
