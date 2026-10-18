import { FightStatBuffed } from "../../../../../Lib/src/types/FightActionResult";
import { FightStatModifierOperation } from "../../../../../Lib/src/types/FightStatModifierOperation";
import { PetAssistanceResult } from "../../../../../Lib/src/types/PetAssistanceResult";
import { Fighter } from "../fighter/Fighter";
import { FightActionController } from "./FightActionController";

export type GearStatPart = {
	stat: FightStatBuffed;
	total: number;
	gear: number;
};

/**
 * Multiplier removing the gear share of a stat, or `null` when it cannot be computed:
 * a stat already at 0 would otherwise become `0 * Infinity = NaN` and cancel every attack using it (#4883)
 */
export function getGearRemovalMultiplier({
	total, gear
}: GearStatPart): number | null {
	if (gear === 0 || total <= 0) {
		return null;
	}
	return Math.max(0, (total - gear) / total);
}

/**
 * Lower the target's stats by the share its removed gear was providing, skipping the stats that cannot be computed
 */
export function applyGearRemovalBuffs(result: PetAssistanceResult, target: Fighter, parts: GearStatPart[]): void {
	for (const part of parts) {
		const multiplier = getGearRemovalMultiplier(part);
		if (multiplier !== null) {
			FightActionController.applyBuff(result, {
				selfTarget: false,
				stat: part.stat,
				operator: FightStatModifierOperation.MULTIPLIER,
				value: multiplier
			}, target, null);
		}
	}
}
