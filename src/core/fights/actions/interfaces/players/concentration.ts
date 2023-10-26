import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionResult} from "@Lib/src/interfaces/FightActionResult";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {FightActionStatus} from "@Lib/src/interfaces/FightActionStatus";

const use: FightActionFunc = (_fight, _fightAction, sender) => {
	const result: FightActionResult = {
		attackStatus: undefined,
		damages: 0
	};
	FightActionController.applyAlteration(result, {
		selfTarget: true,
		alteration: FightAlterations.CONCENTRATED
	}, sender);
	result.fail = !result.alterations;
	result.attackStatus = result.fail ? FightActionStatus.MISSED : FightActionStatus.NORMAL;
	return result;
};

export default use;