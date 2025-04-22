import { FightActionFunc } from "../../../../../data/FightAction";
import {
	customMessageActionResult
} from "../../../../../../../Lib/src/types/FightActionResult";

const use: FightActionFunc = sender => {
	sender.nextFightAction = null;
	return customMessageActionResult();
};

export default use;
