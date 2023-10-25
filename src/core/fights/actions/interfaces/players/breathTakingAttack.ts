import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightActionController} from "../../FightActionController";
import {RandomUtils} from "../../../../utils/RandomUtils";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionResult, FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";

function getAttackInfo(): attackInfo {
	return {
		minDamage: 30,
		averageDamage: 60,
		maxDamage: 100
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

const use: FightActionFunc = (_fight, _fightAction, sender, receiver) => {
	const initialDamage = FightActionController.getAttackDamage(getStatsInfo(sender, receiver), sender, getAttackInfo());

	const damageDealt = FightActionController.applySecondaryEffects(initialDamage, 1, 10);

	const result: FightActionResult = {
		attackStatus: damageDealt.status,
		damages: damageDealt.damages
	};
	receiver.damage(result.damages);

	// 60% chance of reducing the opponent's speed by 20%. Otherwise, steal 1 point of breath from the opponent.
	if (RandomUtils.draftbotRandom.bool(0.4) || receiver.getBreath() < 1) {
		// Reduce target speed by 20%
		FightActionController.applyBuff(result, {
			selfTarget: false,
			stat: FightStatBuffed.SPEED,
			operator: FightStatModifierOperation.MULTIPLIER,
			value: 0.8
		}, {
			sender,
			receiver
		}, this);
	}
	else {
		FightActionController.applyBuff(result, {
			selfTarget: false,
			stat: FightStatBuffed.BREATH,
			operator: FightStatModifierOperation.ADDITION,
			value: -1
		}, {
			sender,
			receiver
		}, this);
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: FightStatBuffed.BREATH,
			operator: FightStatModifierOperation.ADDITION,
			value: 1
		}, {
			sender,
			receiver
		}, this);
	}
	return result;
};

export default use;
