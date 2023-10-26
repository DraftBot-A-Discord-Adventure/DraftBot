import {FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionStatus} from "@Lib/src/interfaces/FightActionStatus";

const use: FightActionFunc = (_fight, _fightAction, sender) => {
	sender.nextFightAction = null;
	return {
		attackStatus: FightActionStatus.NORMAL,
		damages: 0
	};
};

export default use;
