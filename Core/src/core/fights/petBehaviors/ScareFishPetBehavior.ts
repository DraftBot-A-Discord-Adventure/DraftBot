import { AiPlayerFighter } from "../fighter/AiPlayerFighter";
import { FightView } from "../FightView";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {PetBehavior} from "../PetAssistManager";
import {FightConstants} from "../../../../../Lib/src/constants/FightConstants";

class ScareFishPetBehavior implements PetBehavior {

	chooseAction(_me: AiPlayerFighter, _fightView: FightView): FightAction {
		// Return the Scare Fish action
		return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.SCARE_FISH);
	}
}

export default ScareFishPetBehavior;