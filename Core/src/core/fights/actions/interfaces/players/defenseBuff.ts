import {FightActionFunc} from "../../../../../data/FightAction";
import {FightStatModifierOperation} from "../../../../../../../Lib/src/types/FightStatModifierOperation";
import {defaultFightActionResult, FightStatBuffed} from "../../../../../../../Lib/src/types/FightActionResult";
import {FightActionController} from "../../FightActionController";

const use: FightActionFunc = (sender, _receiver, fightAction) => {
	// Amount of times the sender has used the move already in its 3 last moves
	const streak = sender.fightActionsHistory.slice(-3)
		.filter(action => action === fightAction).length;

	const defenseBuffArray = [20, 25, 35, 40];

	const result = defaultFightActionResult();
	FightActionController.applyBuff(result, {
		selfTarget: true,
		stat: FightStatBuffed.DEFENSE,
		operator: FightStatModifierOperation.MULTIPLIER,
		value: 1 + defenseBuffArray[streak] / 100
	}, sender, fightAction);
	result.customMessage = true;

	return result;
};

export default use;
