import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";
import {FightAlterationFunc} from "@Core/src/data/FightAlteration";
import {FightActionDataController} from "@Core/src/data/FightAction";
import {FightAlterationState} from "@Lib/src/interfaces/FightAlterationResult";
import {FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {defaultFightAlterationResult, defaultHealFightAlterationResult} from "@Core/src/core/fights/FightController";

const use: FightAlterationFunc = (affected, fightAlteration) => {
	if (affected.alterationTurn > 2) { // This effect heals after two turns
		affected.removeSpeedModifiers(fightAlteration);
		return defaultHealFightAlterationResult(affected);
	}

	// 20% chance to not attack this turn
	if (Math.random() < 0.2) {
		affected.nextFightAction = FightActionDataController.instance.getNone();
		return {
			state: FightAlterationState.NO_ACTION,
			damages: 0
		};
	}

	const result = defaultFightAlterationResult();
	if (!affected.hasSpeedModifier(fightAlteration)) {
		result.state = FightAlterationState.NEW;
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: FightStatBuffed.SPEED,
			operator: FightStatModifierOperation.SET_VALUE,
			value: 0
		}, affected, fightAlteration);
	}
	return result;
};

export default use;