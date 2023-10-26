import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightActionDataController, FightActionFunc} from "@Core/src/data/FightAction";
import {FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";

const use: FightActionFunc = (_fight, fightAction, sender, receiver) => {
	const result = simpleDamageFightAction(
		{sender, receiver},
		{critical: 1, failure: 1},
		{attackInfo: getAttackInfo(), statsInfo: getStatsInfo(sender, receiver)}
	);

	// Increase defense of the sender by 50 %
	FightActionController.applyBuff(result, {
		selfTarget: true,
		stat: FightStatBuffed.DEFENSE,
		operator: FightStatModifierOperation.MULTIPLIER,
		value: 1.5
	}, sender, fightAction);

	sender.nextFightAction = FightActionDataController.instance.getById("chargingAttack");
	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 15,
		averageDamage: 60,
		maxDamage: 100
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
			0.7,
			0.3
		]
	};
}