import {FightActionFunc} from "../../../../../data/FightAction";
import {defaultFightActionResult} from "../../../../../../../Lib/src/types/FightActionResult";

const use: FightActionFunc = (sender) => {
	sender.nextFightAction = null;
	return defaultFightActionResult();
};

export default use;