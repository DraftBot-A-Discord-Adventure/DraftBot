import {FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";

const use: FightActionFunc = (sender, receiver, _fightAction, turn, fight) => {
	const chosenAttack = receiver.getRandomAvailableFightAction();
	return FightActionController.useSecondAttack(sender, receiver, chosenAttack, turn, fight);
};

export default use;