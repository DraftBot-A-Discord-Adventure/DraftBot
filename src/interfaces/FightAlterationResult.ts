import {FightActionBuff} from "@Lib/src/interfaces/FightActionResult";

export enum FightAlterationState {
	NEW,
	DAMAGE,
	RANDOM_ACTION,
	NO_ACTION,
	ACTIVE,
	STOP
}

export interface FightAlterationResult {
	state: FightAlterationState,
	damages: number,
	buffs?: FightActionBuff[]
}