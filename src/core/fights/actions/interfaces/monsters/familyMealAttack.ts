import {Fighter} from "../../../fighter/Fighter";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightActionController} from "../../FightActionController";
import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";
import {FightAlterationDataController} from "@Core/src/data/FightAlteration";

const use: FightActionFunc = (sender: Fighter, receiver: Fighter) => {
	const result = simpleDamageFightAction(
		{
			sender,
			receiver
		},
		{
			critical: 0,
			failure: 0
		},
		{
			attackInfo: getAttackInfo(),
			statsInfo: getStatsInfo(sender, receiver)
		}, 10
	);

	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterationDataController.instance.getById(FightAlterations.POISONED)
	}, receiver);

	sender.removeAlteration();

	FightActionController.applyAlteration(result, {
		selfTarget: true,
		alteration: FightAlterationDataController.instance.getById(FightAlterations.FULL)
	}, sender);

	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 20,
		averageDamage: 30,
		maxDamage: 50
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
