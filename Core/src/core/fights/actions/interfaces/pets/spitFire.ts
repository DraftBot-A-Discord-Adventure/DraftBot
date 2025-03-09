import {FightActionController} from "../../FightActionController";
import {PetAssistanceFunc} from "../../../../../data/PetAssistance";
import {PetAssistanceResult, PetAssistanceState} from "../../../../../../../Lib/src/types/PetAssistanceResult";
import {FightAlterations} from "../../FightAlterations";

const use: PetAssistanceFunc = (_fighter, opponent, turn, _fightController): Promise<PetAssistanceResult | null> => {

	const result: PetAssistanceResult = {
		assistanceStatus: PetAssistanceState.SUCCESS
	};
	if (turn <= 2) {
		// Burn the opponent at the start of the fight
		FightActionController.applyAlteration(result, {
			selfTarget: false,
			alteration: FightAlterations.BURNED
		}, opponent);
	}
	else {
		return null;
	}
	return Promise.resolve(result);
};

export default use;