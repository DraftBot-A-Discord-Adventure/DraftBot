import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {FightAlterationDataController} from "@Core/src/data/FightAlteration";

const use: FightActionFunc = (sender, receiver) => {
	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 10,
			failure: 5
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);
	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterationDataController.instance.getById(FightAlterations.SLOWED)
	}, receiver);

	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 10,
		averageDamage: 50,
		maxDamage: 60
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
			0.8,
			0.2
		]
	};
}