import {Fighter} from "../../../fighter/Fighter";
import {FightActionFunc} from "../../../../../data/FightAction";
import {simpleDamageFightAction} from "../../templates/SimpleDamageFightActionTemplate";
import {attackInfo, statsInfo} from "../../FightActionController";

const use: FightActionFunc = (sender, receiver) => simpleDamageFightAction(
	{
		sender,
		receiver
	},
	{
		critical: 10,
		failure: sender.getSpeed() > receiver.getSpeed() ? 0 : 20
	},
	{
		attackInfo: getAttackInfo(),
		statsInfo: getStatsInfo(sender, receiver)
	}
);

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 25,
		averageDamage: 90,
		maxDamage: 180
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
