import {FightStatModifierOperation} from "./FightStatModifierOperation";
import {FightActionStatus} from "./FightActionStatus";

export enum FightStatBuffed {
    ATTACK,
    DEFENSE,
    SPEED
}

interface FightActionBuff {
    selfTarget: boolean,
    stat: FightStatBuffed
    operator: FightStatModifierOperation,
    value: number
}

export interface FightActionResult {
    fail?: boolean,
    buffs?: FightActionBuff[],
    damages: number,
    attackStatus: FightActionStatus
}