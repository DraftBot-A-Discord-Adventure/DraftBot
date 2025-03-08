import {PetAssistanceResult, PetAssistanceState} from "../../../../../../../Lib/src/types/PetAssistanceResult";
import {PetAssistanceFunc} from "../../../../../data/PetAssistance";

const use: PetAssistanceFunc = (): PetAssistanceResult => ({
	assistanceStatus: PetAssistanceState.GENERAL_EFFECT
});

export default use;