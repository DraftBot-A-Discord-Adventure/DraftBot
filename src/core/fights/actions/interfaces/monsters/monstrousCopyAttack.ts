import {RandomUtils} from "../../../../utils/RandomUtils";
import {FightActionDataController, FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {Monster, MonsterDataController} from "@Core/src/data/Monster";

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