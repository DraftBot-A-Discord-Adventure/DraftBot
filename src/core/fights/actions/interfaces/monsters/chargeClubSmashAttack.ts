import {Fighter} from "../../../fighter/Fighter";
import {FightActionDataController, FightActionFunc} from "@Core/src/data/FightAction";
import {defaultFightActionResult} from "@Lib/src/interfaces/FightActionResult";

const use: FightActionFunc = (sender: Fighter) => {
	// Set the next fight action of the sender to be the club smash attack
	sender.nextFightAction = FightActionDataController.instance.getById("clubSmashAttack");
	return defaultFightActionResult();
};

export default use;