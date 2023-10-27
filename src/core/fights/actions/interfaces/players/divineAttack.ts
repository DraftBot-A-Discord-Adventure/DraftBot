import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {FightConstants} from "../../../../constants/FightConstants";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";
import {defaultFailFightActionResult} from "@Lib/src/interfaces/FightActionResult";

export function getUsedGodMoves(sender: Fighter, receiver: Fighter): number {
	return sender.fightActionsHistory.filter(action => action.id in FightConstants.GOD_MOVES).length +
		receiver.fightActionsHistory.filter(action => action.id in FightConstants.GOD_MOVES).length;
}

function getAttackInfo(): attackInfo {
	return {
		minDamage: 75,
		averageDamage: 220,
		maxDamage: 360
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

const use: FightActionFunc = (_fight, _fightAction, sender, receiver, turn) => {
	const usedGodMoves = getUsedGodMoves(sender, receiver);

	// Only works if less than 2 god moves have been used
	if (usedGodMoves >= 2) {
		return defaultFailFightActionResult();
	}
	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 0,
			failure: Math.round(95 - turn * 7 < 10 ? 10 : 95 - turn * 7)
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);

	if (Math.random() < 0.2) {
		FightActionController.applyAlteration(result, {
			selfTarget: false,
			alteration: FightAlterations.PARALYZED
		}, receiver);
	}
	return result;
};

export default use;