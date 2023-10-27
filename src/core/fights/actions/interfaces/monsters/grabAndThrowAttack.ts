import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightActionType} from "@Lib/src/interfaces/FightActionType";
import {FightAlterations} from "../../FightAlterations";
import {RandomUtils} from "../../../../utils/RandomUtils";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {defaultFailFightActionResult} from "@Lib/src/interfaces/FightActionResult";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";

const use: FightActionFunc = (_fight, _fightAction, sender, receiver) => {
	if (!receiver.getLastFightActionUsed() || receiver.getLastFightActionUsed().type !== FightActionType.PHYSICAL) {
		return defaultFailFightActionResult();
	}
	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 10,
			failure: 10
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);

	// The receiver has a 50% chance to be stunned
	if (RandomUtils.draftbotRandom.bool()) {
		FightActionController.applyAlteration(result, {
			selfTarget: false,
			alteration: FightAlterations.STUNNED
		}, receiver);
	}

	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 70,
		averageDamage: 90,
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
			0.8,
			0.2
		]
	};
}