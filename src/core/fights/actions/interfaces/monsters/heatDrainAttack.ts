import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {defaultFightActionResult, FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";
import {FightAlterationDataController} from "@Core/src/data/FightAlteration";

const use: FightActionFunc = (sender, receiver, fightAction) => {
	const result = defaultFightActionResult();
	FightActionController.applyBuff(result, {
		selfTarget: true,
		stat: FightStatBuffed.ATTACK,
		operator: FightStatModifierOperation.MULTIPLIER,
		value: 1.2
	}, sender, fightAction);
	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterationDataController.instance.getById(FightAlterations.FROZEN)
	}, receiver);
	return result;
};

export default use;