import {FightActionFunc} from "../../../../../data/FightAction";
import {simpleBuffFightAction} from "../../templates/SimpleBuffFightActionTemplate";
import {FightStatBuffed} from "../../../../../../../Lib/src/types/FightActionResult";
import {FightStatModifierOperation} from "../../../../../../../Lib/src/types/FightStatModifierOperation";

const use: FightActionFunc = (sender, _receiver, fightAction) => ({
	...simpleBuffFightAction(sender, {
		selfTarget: true,
		stat: FightStatBuffed.DAMAGE_BOOST,
		value: 2,
		operator: FightStatModifierOperation.MULTIPLIER,
		duration: 1
	}, fightAction),
	customMessage: true
});

export default use;