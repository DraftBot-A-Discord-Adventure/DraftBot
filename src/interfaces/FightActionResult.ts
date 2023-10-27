import {FightStatModifierOperation} from "./FightStatModifierOperation";
import {FightActionStatus} from "./FightActionStatus";
import {FightAlteration} from "@Core/src/data/FightAlteration";

export enum FightStatBuffed {
	ATTACK,
	DEFENSE,
	SPEED,
	BREATH,
	ENERGY,
	DAMAGE,
	SUMMON,
	DAMAGE_BOOST,
}

export interface FightActionBuff {
	selfTarget: boolean,
	stat: FightStatBuffed
	operator: FightStatModifierOperation,
	value: number,
	duration?: number
}

export interface FightActionResult {
	fail?: boolean,
	buffs?: FightActionBuff[],
	damages: number,
	attackStatus: FightActionStatus,
	alterations?: FightAlterationApplied[]
	usedAction?: {
		id: string,
		result: FightActionResult,
		fromFighter: string
	}
}

export function defaultFightActionResult(): FightActionResult {
	return {
		damages: 0,
		attackStatus: FightActionStatus.NORMAL
	};
}

export function defaultFailFightActionResult(): FightActionResult {
	return {
		fail: true,
		damages: 0,
		attackStatus: FightActionStatus.MISSED
	};
}

export function fightActionResultFromSuccessTest(success: boolean): FightActionResult {
	return success ? defaultFightActionResult() : defaultFailFightActionResult();
}

export function updateFightActionResultFromSuccessTest(result: FightActionResult, success: boolean): FightActionResult {
	result.fail = !success;
	result.attackStatus = success ? FightActionStatus.NORMAL : FightActionStatus.MISSED;
	return result;
}

export interface FightAlterationApplied {
	selfTarget: boolean,
	alteration: FightAlteration
}
