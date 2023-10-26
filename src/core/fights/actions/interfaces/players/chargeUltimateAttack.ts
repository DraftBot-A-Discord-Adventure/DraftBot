import {FightActionDataController, FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionStatus} from "@Lib/src/interfaces/FightActionStatus";

const use: FightActionFunc = (_fight, _fightAction, sender) => {
	const usedUltimateAttacks = sender.fightActionsHistory.filter(action => action === this).length;
	if (usedUltimateAttacks == 0) {
		// Set the next fight action of the sender to be the ultimate attack
		sender.nextFightAction = FightActionDataController.instance.getById("ultimateAttack");
	}
	return {
		attackStatus: FightActionStatus.NORMAL,
		damages: 0,
		fail: usedUltimateAttacks >= 1
	};
};

export default use;
