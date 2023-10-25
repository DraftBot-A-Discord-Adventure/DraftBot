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
	const buff = (1 + (turn < 15 ? Math.round(1.67 * turn) : 25)) / 100;

	for (const statBuffed of [FightStatBuffed.ATTACK, FightStatBuffed.DEFENSE, FightStatBuffed.SPEED]) {
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: statBuffed,
			operator: FightStatModifierOperation.ADDITION,
			value: buff
		}, {
			sender,
			receiver
		}, this);
	}

	return result;
};

export default use;