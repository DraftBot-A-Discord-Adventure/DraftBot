import {RandomUtils} from "../../../../utils/RandomUtils";
import {FightActionDataController, FightActionFunc} from "../../../../../data/FightAction";
import {FightActionController} from "../../FightActionController";
import {Monster, MonsterDataController} from "../../../../../data/Monster";

const use: FightActionFunc = (sender, receiver, fightAction, turn, fight) => {
	let chosenAttackId: string;
	let monster: Monster;
	do {
		monster = MonsterDataController.instance.getRandomMonster();
		chosenAttackId = RandomUtils.draftbotRandom.pick(monster.attacks).id;
	} while (chosenAttackId === fightAction.id);
	const result = FightActionController.useSecondAttack(sender, receiver, FightActionDataController.instance.getById(chosenAttackId), turn, fight);
	result.usedAction.fromFighter = monster.id;
	return result;
};

export default use;