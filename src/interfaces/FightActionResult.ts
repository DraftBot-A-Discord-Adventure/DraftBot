import {FightStatModifierOperation} from "./FightStatModifierOperation";
import {FightActionStatus} from "./FightActionStatus";
import {FightAlterations} from "@Core/src/core/fights/actions/FightAlterations";

export enum FightStatBuffed {
	ATTACK,
	DEFENSE,
	SPEED,
	BREATH,
	ENERGY,
	DAMAGE
}

export interface FightActionBuff {
	selfTarget: boolean,
	stat: FightStatBuffed
	operator: FightStatModifierOperation,
	value: number
}

export interface FightActionResult {
	fail?: boolean,
	buffs?: FightActionBuff[],
	damages: number,
	attackStatus: FightActionStatus,
	alterations?: FightAlteration[]
}

export interface FightAlteration {
	selfTarget: boolean,
	alteration: (typeof FightAlterations)[keyof typeof FightAlterations]
}