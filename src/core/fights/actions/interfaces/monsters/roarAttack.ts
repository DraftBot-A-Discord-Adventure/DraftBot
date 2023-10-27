import {FightActionFunc} from "@Core/src/data/FightAction";
import {defaultFightActionResult, FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";

const use: FightActionFunc = (_fight, fightAction, sender, receiver) => {
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