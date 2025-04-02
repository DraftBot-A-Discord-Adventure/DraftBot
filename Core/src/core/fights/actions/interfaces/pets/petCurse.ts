import { FightActionController } from "../../FightActionController";
import { PetAssistanceFunc } from "../../../../../data/PetAssistance";
import {
	PetAssistanceResult, PetAssistanceState
} from "../../../../../../../Lib/src/types/PetAssistanceResult";
import { FightAlterations } from "../../FightAlterations";

const use: PetAssistanceFunc = (_fighter, opponent, turn, _fightController): Promise<PetAssistanceResult | null> => {
	// Will be executed on turn 14 / 15
	if (turn !== 14 && turn !== 15) {
		return null;
	}

	const result: PetAssistanceResult = {
		assistanceStatus: PetAssistanceState.SUCCESS
	};

	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterations.CURSED
	}, opponent);

	return Promise.resolve(result);
};

export default use;
