import {Fighter} from "../../fighter/Fighter";
import {FightActionController} from "../FightActionController";
import {defaultFightActionResult, FightActionBuff, FightActionResult} from "@Lib/src/interfaces/FightActionResult";
import {FightAction} from "@Core/src/data/FightAction";

export function simpleBuffFightAction(target: Fighter, buff: FightActionBuff, fightAction: FightAction): FightActionResult {
	const result = defaultFightActionResult();
	FightActionController.applyBuff(result, buff, target, fightAction);
	return result;
}
