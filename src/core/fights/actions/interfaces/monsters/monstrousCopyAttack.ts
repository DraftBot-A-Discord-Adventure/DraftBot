import {RandomUtils} from "../../../../utils/RandomUtils";
import {FightAction, FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {Monster, MonsterDataController} from "@Core/src/data/Monster";

const use: FightActionFunc = (fight, fightAction, sender, receiver, turn) => {
	let chosenAttack: FightAction;
	let monster: Monster;
	do {
		monster = MonsterDataController.instance.getRandomMonster();
		chosenAttack = RandomUtils.draftbotRandom.pick(monster.attacks);
	} while (chosenAttack.id === fightAction.id);
	const result = FightActionController.useSecondAttack(fight, chosenAttack, sender, receiver, turn);
	result.usedAction.fromFighter = monster.id;
	return result;
};

export default use;