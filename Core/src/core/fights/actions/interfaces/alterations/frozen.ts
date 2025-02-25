import {FightAlterationFunc} from "../../../../../data/FightAlteration";
import {FightAlterationState} from "../../../../../../../Lib/src/types/FightAlterationResult";
import {FightActionController} from "../../FightActionController";
import {FightStatBuffed} from "../../../../../../../Lib/src/types/FightActionResult";
import {FightStatModifierOperation} from "../../../../../../../Lib/src/types/FightStatModifierOperation";
import {defaultFightAlterationResult, defaultHealFightAlterationResult} from "../../../FightController";

const use: FightAlterationFunc = (affected, fightAlteration, opponent) => {
	// 50% chance to be healed from the frozen (except for the first two turns)
	if (Math.random() < 0.5 && affected.alterationTurn > 2) {
		affected.removeSpeedModifiers(fightAlteration);
		return defaultHealFightAlterationResult(affected);
	}
	const result = defaultFightAlterationResult();
	result.state = FightAlterationState.ACTIVE;
	if (!affected.hasSpeedModifier(fightAlteration)) {
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: FightStatBuffed.SPEED,
			operator: FightStatModifierOperation.MULTIPLIER,
			value: 0.4
		}, affected, fightAlteration);
	}
	result.damages = Math.round((affected.getMaxBreath() - affected.getBreath()) * 0.2 * opponent.getSpeed());
	return result;
};

export default use;