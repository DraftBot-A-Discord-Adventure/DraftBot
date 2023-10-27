import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {defaultFightActionResult, FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";

const use: FightActionFunc = (fight, fightAction, sender, receiver) => {
	const result = defaultFightActionResult();
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