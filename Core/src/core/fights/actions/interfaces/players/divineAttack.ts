import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightActionController, statsInfo} from "../../FightActionController";
import {FightConstants} from "../../../../../../../Lib/src/constants/FightConstants";
import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "../../../../../data/FightAction";
import {simpleDamageFightAction} from "../../templates/SimpleDamageFightActionTemplate";
import {defaultMaxUsesFightActionResult} from "../../../../../../../Lib/src/types/FightActionResult";

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

const use: FightActionFunc = (sender, receiver, _fightAction, turn) => {
	const usedGodMoves = getUsedGodMoves(sender, receiver);

	// Only works if less than 2 god moves have been used
	if (usedGodMoves >= 2) {
		return defaultMaxUsesFightActionResult();
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