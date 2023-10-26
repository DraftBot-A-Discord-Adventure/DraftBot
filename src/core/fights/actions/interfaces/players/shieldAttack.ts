import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, statsInfo} from "../../FightAction";
import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {simpleDamageFightAction} from "@Core/src/core/fights/actions/templates/SimpleDamageFightActionTemplate";

const use: FightActionFunc = (_fight, _fightAction, sender, receiver) => {
	const result = simpleDamageFightAction(
		{sender, receiver},
		{critical: 5, failure: 5},
		{attackInfo: getAttackInfo(), statsInfo: getStatsInfo(sender, receiver)}
	);
	FightActionController.applyAlteration(result, {
		selfTarget: false,
		alteration: FightAlterations.WEAK
	}, receiver);
	return result;
};

export default use;

function getAttackInfo(): attackInfo {
	return {minDamage: 15, averageDamage: 60, maxDamage: 85};
}

function getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
	return {
		attackerStats: [
			sender.getDefense(),
			sender.getAttack()
		], defenderStats: [
			receiver.getDefense(),
			receiver.getDefense()
		], statsEffect: [
			0.8,
			0.2
		]
	};
}
