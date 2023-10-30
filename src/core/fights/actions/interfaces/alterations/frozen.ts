import {FightAlterationFunc} from "@Core/src/data/FightAlteration";
import {FightAlterationState} from "@Lib/src/interfaces/FightAlterationResult";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";
import {defaultFightAlterationResult, defaultHealFightAlterationResult} from "@Core/src/core/fights/FightController";

const use: FightAlterationFunc = (affected, fightAlteration, opponent) => {
	// 50% chance to be healed from the frozen (except for the first two turns)
	if (Math.random() < 0.5 && affected.alterationTurn > 2) {
		affected.removeSpeedModifiers(fightAlteration);
		return defaultHealFightAlterationResult(affected);
	}
	const result = defaultFightAlterationResult();
	result.state = FightAlterationState.DAMAGE;
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