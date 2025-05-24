import { FightActionController } from "../../FightActionController";
import { PetAssistanceFunc } from "../../../../../data/PetAssistance";
import {
	PetAssistanceResult, PetAssistanceState
} from "../../../../../../../Lib/src/types/PetAssistanceResult";
import { FightAlterations } from "../../FightAlterations";

const use: PetAssistanceFunc = (_fighter, opponent, turn, _fightController): Promise<PetAssistanceResult | null> => {
	if (turn > 3 || turn === 1 || opponent.hasFightAlteration()) {
		return null;
	}

	const result: PetAssistanceResult = {
		assistanceStatus: PetAssistanceState.SUCCESS
	};

	// Swallow the opponent
	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterations.SWALLOWED
	}, opponent);

	return Promise.resolve(result);
};

export default use;
