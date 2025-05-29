import { FightActionFunc } from "../../../../../data/FightAction";
import { Fighter } from "../../../fighter/Fighter";
import { simpleDamageFightAction } from "../../templates/SimpleDamageFightActionTemplate";
import {
	attackInfo, statsInfo
} from "../../FightActionController";

const use: FightActionFunc = (sender, receiver) => simpleDamageFightAction(
	{
		sender,
		receiver
	},
	{
		critical: 15,
		failure: sender.getSpeed() > receiver.getSpeed() ? 0 : 50
	},
	{
		attackInfo: getAttackInfo(),
		statsInfo: getStatsInfo(sender, receiver)
	}
);

function getAttackInfo(): attackInfo {
	return {
		minDamage: 50,
		averageDamage: 90,
		maxDamage: 200
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
			0.4,
			0.6
		]
	};
}

export default use;
