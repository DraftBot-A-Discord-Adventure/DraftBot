import {FightActionDataController, FightActionFunc} from "@Core/src/data/FightAction";
import {fightActionResultFromSuccessTest} from "@Lib/src/interfaces/FightActionResult";

const use: FightActionFunc = (sender) => {
	const usedUltimateAttacks = sender.fightActionsHistory.filter(action => action === this).length;
	if (usedUltimateAttacks === 0) {
		// Set the next fight action of the sender to be the ultimate attack
		sender.nextFightAction = FightActionDataController.instance.getById("ultimateAttack");
	}
	return fightActionResultFromSuccessTest(usedUltimateAttacks === 0);
};

export default use;
