import { FightActionFunc } from "../../../../../data/FightAction";
import { FightActionController } from "../../FightActionController";

const use: FightActionFunc = (sender, receiver, _fightAction, turn, fight) => {
	const chosenAttack = receiver.getRandomAvailableFightAction();
	return FightActionController.useSecondAttack(sender, receiver, chosenAttack, turn, fight);
};

export default use;
