import {FightActionFunc} from "../../../../../data/FightAction";
import {customMessageActionResult, FightActionResult} from "../../../../../../../Lib/src/types/FightActionResult";


const use: FightActionFunc = (): FightActionResult => customMessageActionResult();

export default use;