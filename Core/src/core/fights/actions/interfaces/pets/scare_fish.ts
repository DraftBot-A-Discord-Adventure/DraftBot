import {FightActionFunc} from "../../../../../data/FightAction";
import {PetAssistanceResult, PetAssistanceState} from "../../../../../../../Lib/src/types/PetAssistanceResult";


const use: FightActionFunc = (): PetAssistanceResult => ({
	assistanceStatus: PetAssistanceState.GENERAL_EFFECT
});

export default use;