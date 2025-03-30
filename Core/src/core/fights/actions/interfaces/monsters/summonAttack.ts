import {Fighter} from "../../../fighter/Fighter";
import {FightActionFunc} from "../../../../../data/FightAction";
import {defaultFailFightActionResult} from "../../../../../../../Lib/src/types/FightActionResult";
import {simpleDamageFightAction} from "../../templates/SimpleDamageFightActionTemplate";
import {attackInfo, FightActionController, statsInfo} from "../../FightActionController";
import {FightAlterations} from "../../FightAlterations";

const use: FightActionFunc = (sender, receiver) => {
	// Fail if already used
	if (sender.fightActionsHistory.filter((attack) => attack.id === "summonAttack").length !== 0) {
		return defaultFailFightActionResult();
	}

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
		}
	);

	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterations.ALLIES_ARE_PRESENT
	}, receiver);

	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {
		minDamage: 25,
		averageDamage: 90,
		maxDamage: 150
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