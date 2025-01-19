import {FightActionDataController, FightActionFunc} from "../../../../../data/FightAction";
import {fightActionResultFromSuccessTest} from "../../../../../../../Lib/src/types/FightActionResult";

const use: FightActionFunc = (sender) => {
	const usedUltimateAttacks = sender.fightActionsHistory.filter(action => action === this).length;
	if (usedUltimateAttacks === 0) {
		// Set the next fight action of the sender to be the ultimate attack
		sender.nextFightAction = FightActionDataController.instance.getById("ultimateAttack");
	}
	return fightActionResultFromSuccessTest(usedUltimateAttacks === 0);
};

export default use;
