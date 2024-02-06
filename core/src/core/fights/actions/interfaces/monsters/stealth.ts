import {FightActionFunc} from "../../../../../data/FightAction";
import {simpleBuffFightAction} from "../../templates/SimpleBuffFightActionTemplate";
import {FightStatBuffed} from "../../../../../../../Lib/src/interfaces/FightActionResult";
import {FightStatModifierOperation} from "../../../../../../../Lib/src/interfaces/FightStatModifierOperation";

const use: FightActionFunc = (sender, _receiver, fightAction) => simpleBuffFightAction(sender, {
	selfTarget: true,
	stat: FightStatBuffed.DAMAGE_BOOST,
	value: 2,
	operator: FightStatModifierOperation.MULTIPLIER,
	duration: 1
}, fightAction);

export default use;