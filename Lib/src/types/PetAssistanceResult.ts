import {FightActionBuff, FightAlterationApplied} from "./FightActionResult";

/**
 * Pet assistance state, those are also the keys used in the translation files, so they should be kept in sync
 * Note, those should also not collide with FightActionStatus or fight alteration state
 */
export enum PetAssistanceState {
	GENERAL_EFFECT = "generalEffect",
	SUCCESS = "success",
	AFRAID = "afraid",
	FAILURE = "failure",
}

export interface PetAssistanceResult {
	assistanceStatus: PetAssistanceState,
	damages?: number,
	buffs?: FightActionBuff[],
	alterations?: FightAlterationApplied[]
}