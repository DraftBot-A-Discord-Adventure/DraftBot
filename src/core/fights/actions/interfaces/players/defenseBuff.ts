import {FightActionFunc} from "@Core/src/data/FightAction";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";
import {FightActionResult, FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightActionStatus} from "@Lib/src/interfaces/FightActionStatus";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";

const use: FightActionFunc = (_fight, fightAction, sender) => {
	// Amount of times the sender has used the move already in its 3 last moves
	const streak = sender.fightActionsHistory.slice(-3)
		.filter(action => action === fightAction).length;

	const defenseBuffArray = [20, 25, 35, 40];

	const result: FightActionResult = {
		attackStatus: FightActionStatus.NORMAL,
		damages: 0
	};
	FightActionController.applyBuff(result, {
		selfTarget: true,
		stat: FightStatBuffed.DEFENSE,
		operator: FightStatModifierOperation.MULTIPLIER,
		value: 1 + defenseBuffArray[streak] / 100
	}, sender, fightAction);

	return result;
};

export default use;
