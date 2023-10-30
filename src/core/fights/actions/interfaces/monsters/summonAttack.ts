import {Fighter} from "../../../fighter/Fighter";
import {RandomUtils} from "../../../../utils/RandomUtils";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {defaultFailFightActionResult} from "@Lib/src/interfaces/FightActionResult";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";
import {attackInfo, statsInfo} from "@Core/src/core/fights/actions/FightActionController";

const use: FightActionFunc = (sender, receiver) => {
	// Fail if already used
	if (sender.fightActionsHistory.filter((attack) => attack.id === "summonAttack").length !== 0) {
		return defaultFailFightActionResult();
	}

	return simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 5,
			failure: 10
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}, RandomUtils.randInt(2, 6) // Number of summoned allies
	);
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 25,
		averageDamage: 90,
		maxDamage: 150
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack(),
			sender.getSpeed()
		],
		defenderStats: [
			receiver.getDefense(),
			receiver.getSpeed()
		],
		statsEffect: [
			0.8,
			0.2
		]
	};
}