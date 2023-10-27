import {FightAlterationFunc} from "@Core/src/data/FightAlteration";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";
import {defaultFightAlterationResult, defaultHealFightAlterationResult, FightAlterationState} from "@Lib/src/interfaces/FightAlterationResult";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";

const use: FightAlterationFunc = (affected, fightAlteration) => {
	if (affected.alterationTurn > 2) { // This effect heals after two turns
		affected.removeDefenseModifiers(fightAlteration);
		return defaultHealFightAlterationResult(affected);
	}

	const result = defaultFightAlterationResult();

	if (!affected.hasDefenseModifier(fightAlteration)) {
		result.state = FightAlterationState.NEW;
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: FightStatBuffed.DEFENSE,
			operator: FightStatModifierOperation.MULTIPLIER,
			value: 1.3
		}, affected, fightAlteration);
	}
	return result;
};

export default use;