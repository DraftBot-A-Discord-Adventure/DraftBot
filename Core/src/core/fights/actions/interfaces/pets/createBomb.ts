import { Fighter } from "../../../fighter/Fighter";
import {
	attackInfo, FightActionController, statsInfo
} from "../../FightActionController";
import { PetAssistanceFunc } from "../../../../../data/PetAssistance";
import {
	PetAssistanceResult, PetAssistanceState
} from "../../../../../../../Lib/src/types/PetAssistanceResult";

function getAttackInfo(): attackInfo {
	return {
		minDamage: 50,
		averageDamage: 130,
		maxDamage: 180
	};
}

function getStatsInfo(_sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [1200],
		defenderStats: [receiver.getDefense()],
		statsEffect: [1]
	};
}

const use: PetAssistanceFunc = (fighter, opponent, turn, _fightController): Promise<PetAssistanceResult | null> => {
	if (turn <= 2) {
		return Promise.resolve({
			assistanceStatus: PetAssistanceState.GENERAL_EFFECT
		});
	}

	// Last turn of the fight, bomb explodes?
	if (turn === 23 || turn === 24) {
		if (fighter.getSpeed() < opponent.getSpeed()) {
			return Promise.resolve({
				assistanceStatus: PetAssistanceState.FAILURE
			});
		}
		return Promise.resolve({
			damages: FightActionController.getAttackDamage(getStatsInfo(fighter, opponent), fighter, getAttackInfo(), true),
			assistanceStatus: PetAssistanceState.SUCCESS
		});
	}
	return null;
};

export default use;
