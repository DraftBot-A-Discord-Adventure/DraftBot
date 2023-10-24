import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import DivineAttack from "./divineAttack";
import {FightAction, FightActionFunc} from "@Core/src/data/FightAction";
import {FightController} from "../../../FightController";
import {FightActionResult, FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";

function getAttackInfo(): attackInfo {
	return {
		minDamage: 55,
		averageDamage: 100,
		maxDamage: 200
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack(),
			sender.getSpeed()
		],
		defenderStats: [
			receiver.getDefense(),
			receiver.getSpeed()
		],
		statsEffect: [
			0.7,
			0.3
		]
	};
}

const use: FightActionFunc = (fight: FightController, fightAction: FightAction, sender: Fighter, receiver: Fighter, turn: number): FightActionResult => {
	const result: FightActionResult = {
		attackStatus: undefined,
		damages: 0
	};

	// Check the amount of ultimate attacks the sender already used
	// 1 god move per fight
	if (DivineAttack.getUsedGodMoves(sender, receiver) >= 1) {
		result.fail = true;
		return result;
	}

	const initialDamage = FightActionController.getAttackDamage(getStatsInfo(sender, receiver), sender, getAttackInfo());
	const attackApplied = FightActionController.applySecondaryEffects(initialDamage, 5, 10);
	result.damages = attackApplied.damages;
	result.attackStatus = attackApplied.status;

	receiver.damage(result.damages);
	let sideEffects = "";
	const buff = turn < 15 ? Math.round(1.67 * turn) : 25;

	sender.applyDefenseModifier({
		origin: this,
		operation: FightStatModifierOperation.ADDITION,
		value: sender.getDefense() * buff / 100
	});
	sender.applyAttackModifier({
		origin: this,
		operation: FightStatModifierOperation.ADDITION,
		value: sender.getAttack() * buff / 100
	});
	sender.applySpeedModifier({
		origin: this,
		operation: FightStatModifierOperation.ADDITION,
		value: sender.getSpeed() * buff / 100
	});
	result.buffs = [
		{
			selfTarget: true,
			stat: FightStatBuffed.ATTACK,
			operator: FightStatModifierOperation.ADDITION,
			value: buff
		},
		{
			selfTarget: true,
			stat: FightStatBuffed.DEFENSE,
			operator: FightStatModifierOperation.ADDITION,
			value: buff
		},
		{
			selfTarget: true,
			stat: FightStatBuffed.SPEED,
			operator: FightStatModifierOperation.ADDITION,
			value: buff
		}
	];

	return result;
};

export default use;