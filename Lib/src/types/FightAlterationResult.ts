import {FightActionBuff} from "./FightActionResult";

/**
 * Fight alteration state, those are also the keys used in the translation files, so they should be kept in sync
 * Note, those should also not collide with FightActionStatus
 */
export enum FightAlterationState {
	NEW = "new",
	RANDOM_ACTION = "randomAction",
	NO_ACTION = "noAction",
	ACTIVE = "active",
	STOP = "stop"
}

export interface FightAlterationResult {
	state: FightAlterationState,
	damages?: number,
	buffs?: FightActionBuff[]
}