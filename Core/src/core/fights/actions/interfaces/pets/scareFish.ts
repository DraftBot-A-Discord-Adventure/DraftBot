import {PetAssistanceResult, PetAssistanceState} from "../../../../../../../Lib/src/types/PetAssistanceResult";
import {PetAssistanceFunc} from "../../../../../data/PetAssistance";

const use: PetAssistanceFunc = (_sender, _receiver, _fightAction, turn): PetAssistanceResult | null => {
	if (turn > 2) {
		return null;
	}
	return {
		assistanceStatus: PetAssistanceState.GENERAL_EFFECT
	};
};

export default use;