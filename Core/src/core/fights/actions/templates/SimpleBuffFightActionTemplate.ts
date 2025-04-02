import { Fighter } from "../../fighter/Fighter";
import { FightActionController } from "../FightActionController";
import {
	defaultFightActionResult, FightActionBuff, FightActionResult
} from "../../../../../../Lib/src/types/FightActionResult";
import { FightAction } from "../../../../data/FightAction";

export function simpleBuffFightAction(target: Fighter, buff: FightActionBuff, fightAction: FightAction): FightActionResult {
	const result = defaultFightActionResult();
	FightActionController.applyBuff(result, buff, target, fightAction);
	return result;
}
