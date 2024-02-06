import {FightActionFunc} from "../../../../../data/FightAction";
import {defaultFightActionResult} from "../../../../../../../Lib/src/interfaces/FightActionResult";

const use: FightActionFunc = (sender) => {
	sender.nextFightAction = null;
	return defaultFightActionResult();
};

export default use;
