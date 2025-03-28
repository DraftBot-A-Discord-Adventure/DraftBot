import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "../../../../../data/FightAction";
import {defaultFightActionResult, FightStatBuffed} from "../../../../../../../Lib/src/types/FightActionResult";
import {FightActionController} from "../../FightActionController";
import {FightStatModifierOperation} from "../../../../../../../Lib/src/types/FightStatModifierOperation";

const use: FightActionFunc = (sender, receiver, fightAction) => {
	const result = defaultFightActionResult();
	result.customMessage = true;
	FightActionController.applyBuff(result, {
		selfTarget: true,
		stat: FightStatBuffed.ATTACK,
		operator: FightStatModifierOperation.MULTIPLIER,
		value: 1.2
	}, sender, fightAction);
	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterations.FROZEN
	}, receiver);
	return result;
};

export default use;