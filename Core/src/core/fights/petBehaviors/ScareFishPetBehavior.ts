import { AiPlayerFighter } from "../fighter/AiPlayerFighter";
import { FightView } from "../FightView";
import {PetBehavior} from "../PetAssistManager";
import {FightConstants} from "../../../../../Lib/src/constants/FightConstants";
import {PetAssistance, PetAssistanceDataController} from "../../../data/PetAssistance";

class ScareFishPetBehavior implements PetBehavior {

	chooseAction(_me: AiPlayerFighter, _fightView: FightView): PetAssistance {
		// Return the Scare Fish action
		return PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.SCARE_FISH);
	}
}

export default ScareFishPetBehavior;