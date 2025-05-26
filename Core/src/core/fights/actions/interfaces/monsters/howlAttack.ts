import { FightActionFunc } from "../../../../../data/FightAction";
import { FightStatBuffed } from "../../../../../../../Lib/src/types/FightActionResult";
import { RandomUtils } from "../../../../../../../Lib/src/utils/RandomUtils";
import { simpleBuffFightAction } from "../../templates/SimpleBuffFightActionTemplate";
import { FightStatModifierOperation } from "../../../../../../../Lib/src/types/FightStatModifierOperation";


const use: FightActionFunc = (sender, _, fightAction) => {
	const randomStat = RandomUtils.draftbotRandom.pick([
		FightStatBuffed.ATTACK,
		FightStatBuffed.DEFENSE,
		FightStatBuffed.SPEED
	]);

	return {
		...simpleBuffFightAction(sender, {
			selfTarget: true,
			stat: randomStat,
			value: RandomUtils.draftbotRandom.real(1.1, 2),
			operator: FightStatModifierOperation.MULTIPLIER,
			duration: RandomUtils.randInt(1, 5)
		}, fightAction),
		customMessage: true
	};
};

export default use;
