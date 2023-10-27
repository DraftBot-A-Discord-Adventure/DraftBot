import {FightActionBuff} from "@Lib/src/interfaces/FightActionResult";
import {Fighter} from "@Core/src/core/fights/fighter/Fighter";
import {attackInfo, statsInfo} from "@Core/src/core/fights/actions/FightAction";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";

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

export function defaultHealFightAlterationResult(affected: Fighter): FightAlterationResult {
	affected.removeAlteration();
	return {
		state: FightAlterationState.STOP,
		damages: 0
	};
}

export function defaultFightAlterationResult(): FightAlterationResult {
	return {
		state: FightAlterationState.ACTIVE,
		damages: 0
	};
}

export function defaultRandomActionFightAlterationResult(affected: Fighter): FightAlterationResult {
	affected.nextFightAction = affected.getRandomAvailableFightAction();
	return {
		state: FightAlterationState.RANDOM_ACTION,
		damages: 0
	};
}

export function defaultDamageFightAlterationResult(affected: Fighter, statsInfos: statsInfo, attackInfo: attackInfo): FightAlterationResult {
	return {
		state: FightAlterationState.DAMAGE,
		damages: FightActionController.getAttackDamage(statsInfos, affected, attackInfo, true)
	};
}