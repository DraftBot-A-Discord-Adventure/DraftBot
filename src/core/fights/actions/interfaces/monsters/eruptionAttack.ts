import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightWeatherEnum} from "../../../FightWeather";
import {defaultFightActionResult} from "@Lib/src/interfaces/FightActionResult";
import {FightActionFunc} from "@Core/src/data/FightAction";

const use: FightActionFunc = (_fight, _fightAction, sender, _receiver, turn) => {
	_fight.setWeather(FightWeatherEnum.FIRESTORM, turn, sender);
	return defaultFightActionResult();
};

function getAttackInfo(): attackInfo {
	return {
		minDamage: 100,
		averageDamage: 300,
		maxDamage: 400
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack()
		],
		defenderStats: [
			receiver.getDefense()
		],
		statsEffect: [
			1
		]
	};
}