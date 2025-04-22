import { Fighter } from "../../../fighter/Fighter";
import {
	FightActionDataController, FightActionFunc
} from "../../../../../data/FightAction";
import { defaultFightActionResult } from "../../../../../../../Lib/src/types/FightActionResult";

const use: FightActionFunc = (sender: Fighter) => {
	// Set the next fight action of the sender to be the club smash attack
	sender.nextFightAction = FightActionDataController.instance.getById("clubSmashAttack");
	return defaultFightActionResult();
};

export default use;
