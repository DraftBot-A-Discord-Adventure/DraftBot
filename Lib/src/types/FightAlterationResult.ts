import {FightActionBuff} from "./FightActionResult";

export enum FightAlterationState {
	NEW = "new",
	RANDOM_ACTION = "random_action",
	NO_ACTION = "no_action",
	ACTIVE = "active",
	STOP = "stop"
}

export interface FightAlterationResult {
	state: FightAlterationState,
	damages: number,
	buffs?: FightActionBuff[]
}