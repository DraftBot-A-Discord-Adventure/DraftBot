import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, FightActionController, statsInfo} from "../../FightActionController";
import {PetAssistanceFunc} from "../../../../../data/PetAssistance";
import {PetAssistanceResult, PetAssistanceState} from "../../../../../../../Lib/src/types/PetAssistanceResult";
import {FightAlterations} from "../../FightAlterations";

function getAttackInfo(): attackInfo {
	return {
		minDamage: 5,
		averageDamage: 70,
		maxDamage: 100
	};
}

function getStatsInfo(_sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			150,
			200
		],
		defenderStats: [
			receiver.getDefense(),
			receiver.getSpeed()
		],
		statsEffect: [
			0.9,
			0.1
		]
	};
}

const use: PetAssistanceFunc = (fighter, opponent, turn, _fightController): Promise<PetAssistanceResult | null> => {
	// Only use the attack on the first turn
	if (turn > 2) {
		return null;
	}

	const result: PetAssistanceResult = {
		damages: FightActionController.getAttackDamage(getStatsInfo(fighter, opponent), fighter, getAttackInfo()),
		assistanceStatus: PetAssistanceState.SUCCESS
	};
	// Burn the opponent at the start of the fight
	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterations.POISONED
	}, opponent);

	return Promise.resolve(result);
};


export default use;