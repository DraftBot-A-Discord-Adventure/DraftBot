import {Fighter} from "../../fighter/Fighter";
import {FightActionController} from "../FightActionController";
import {defaultFightActionResult, FightActionResult, FightAlterationApplied, updateFightActionResultFromSuccessTest} from "../../../../../../Lib/src/types/FightActionResult";

export function simpleAlterationFightAction(target: Fighter, alteration: FightAlterationApplied): FightActionResult {
	const result = defaultFightActionResult();
	FightActionController.applyAlteration(result, alteration, target);
	return updateFightActionResultFromSuccessTest(result, result.alterations?.length > 0);
}
