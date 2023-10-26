import {FightConstants} from "../../../../constants/FightConstants";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionStatus} from "@Lib/src/interfaces/FightActionStatus";

const use: FightActionFunc = (fight, _fightAction, sender, receiver, turn) => {
	const lastAttack = receiver.getLastFightActionUsed();
	if (FightConstants.UNCOUNTERABLE_ACTIONS.includes(lastAttack.id)) {
		return {
			attackStatus: FightActionStatus.MISSED,
			damages: 0,
			fail: true
		};
	}

	return lastAttack.use(fight, receiver, sender, turn);
};

export default use;