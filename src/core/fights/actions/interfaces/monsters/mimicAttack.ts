import {FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";

const use: FightActionFunc = (fight, _fightAction, sender, receiver, turn) => {
	let chosenAttack = receiver.getRandomAvailableFightAction();
	return FightActionController.useSecondAttack(fight, chosenAttack, receiver, sender, turn);
};

export default use;