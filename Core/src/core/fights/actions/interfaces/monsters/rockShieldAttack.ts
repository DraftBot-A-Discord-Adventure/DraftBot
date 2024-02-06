import {FightActionFunc} from "../../../../../data/FightAction";
import {FightStatBuffed} from "../../../../../../../Lib/src/interfaces/FightActionResult";
import {FightStatModifierOperation} from "../../../../../../../Lib/src/interfaces/FightStatModifierOperation";
import {simpleBuffFightAction} from "../../templates/SimpleBuffFightActionTemplate";

const use: FightActionFunc = (_sender, receiver, fightAction) => simpleBuffFightAction(receiver, {
	selfTarget: false,
	stat: FightStatBuffed.DAMAGE_BOOST,
	value: 0.5,
	operator: FightStatModifierOperation.MULTIPLIER,
	duration: 1
}, fightAction);

export default use;
