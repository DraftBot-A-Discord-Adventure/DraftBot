import { FightActionFunc } from "../../../../../data/FightAction";
import {
	defaultFightActionResult, FightStatBuffed
} from "../../../../../../../Lib/src/types/FightActionResult";
import { FightActionController } from "../../FightActionController";
import { FightStatModifierOperation } from "../../../../../../../Lib/src/types/FightStatModifierOperation";

const use: FightActionFunc = (_sender, receiver, fightAction) => {
	const result = defaultFightActionResult();
	FightActionController.applyBuff(result, {
		selfTarget: false,
		stat: FightStatBuffed.ATTACK,
		value: 0.9,
		operator: FightStatModifierOperation.MULTIPLIER
	}, receiver, fightAction);
	FightActionController.applyBuff(result, {
		selfTarget: false,
		stat: FightStatBuffed.SPEED,
		value: 0.9,
		operator: FightStatModifierOperation.MULTIPLIER
	}, receiver, fightAction);
	return result;
};

export default use;
