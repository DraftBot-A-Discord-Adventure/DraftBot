import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";
import {FightAlterationDataController} from "@Core/src/data/FightAlteration";

const use: FightActionFunc = (sender, receiver) => {
	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 5,
			failure: 10
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);
	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterationDataController.instance.getById(FightAlterations.POISONED)
	}, receiver);
	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 15,
		averageDamage: 20,
		maxDamage: 40
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack(),
			sender.getSpeed()
		],
		defenderStats: [
			receiver.getDefense(),
			receiver.getSpeed()
		],
		statsEffect: [
			0.7,
			0.3
		]
	};
}