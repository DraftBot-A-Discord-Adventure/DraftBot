import {Fighter} from "../../fighter/Fighter";
import {FightActionController} from "../FightActionController";
import {defaultFightActionResult, FightActionResult, FightAlteration, updateFightActionResultFromSuccessTest} from "@Lib/src/interfaces/FightActionResult";

export function simpleAlterationFightAction(target: Fighter, alteration: FightAlteration): FightActionResult {
	const result = defaultFightActionResult();
	FightActionController.applyAlteration(result, alteration, target);
	return updateFightActionResultFromSuccessTest(result, result.alterations.length > 0);
}
