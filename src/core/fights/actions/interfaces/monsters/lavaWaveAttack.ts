import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {FightAlterationDataController} from "@Core/src/data/FightAlteration";

const use: FightActionFunc = (sender, receiver) => {
	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 0,
			failure: 5
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}
	);

	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterationDataController.instance.getById(FightAlterations.BURNED)
	}, receiver);
	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 100,
		averageDamage: 210,
		maxDamage: 280
	};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getAttack()
		],
		defenderStats: [
			receiver.getDefense()
		],
		statsEffect: [
			1
		]
	};
}