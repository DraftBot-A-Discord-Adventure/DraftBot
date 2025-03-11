import {PetAssistanceResult, PetAssistanceState} from "../../../../../../../Lib/src/types/PetAssistanceResult";
import {PetAssistanceFunc} from "../../../../../data/PetAssistance";
import {RandomUtils} from "../../../../../../../Lib/src/utils/RandomUtils";
import {FightActionController} from "../../FightActionController";
import {FightStatBuffed} from "../../../../../../../Lib/src/types/FightActionResult";
import {FightStatModifierOperation} from "../../../../../../../Lib/src/types/FightStatModifierOperation";

const use: PetAssistanceFunc = (fighter, _opponent, _turn, _fightController): Promise<PetAssistanceResult | null> => {

	// 75 % of the time, nothing happens
	if (RandomUtils.draftbotRandom.bool(0.75) || fighter.getBreath() === fighter.getMaxBreath()) {
		return null;
	}

	const result: PetAssistanceResult = {
		assistanceStatus: PetAssistanceState.SUCCESS
	};

	// Give back to the fighter the amount of breath used by the last action
	FightActionController.applyBuff(result, {
		selfTarget: true,
		stat: FightStatBuffed.BREATH,
		operator: FightStatModifierOperation.ADDITION,
		value: 1
	}, fighter, this);

	return Promise.resolve(result);
};

export default use;