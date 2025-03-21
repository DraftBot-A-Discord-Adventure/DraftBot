import {ClassBehavior} from "../AiBehaviorManager";
import {AiPlayerFighter} from "../fighter/AiPlayerFighter";
import {FightView} from "../FightView";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {PlayerFighter} from "../fighter/PlayerFighter";
import {FightConstants} from "../../../../../Lib/src/constants/FightConstants";
import {RandomUtils} from "../../../../../Lib/src/utils/RandomUtils";
import {getUsedGodMoves} from "../FightController";
import {ClassConstants} from "../../../../../Lib/src/constants/ClassConstants";

class PaladinFightBehavior implements ClassBehavior {

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {

		const opponent = fightView.fightController.getDefendingFighter() as PlayerFighter | AiPlayerFighter; // AI will never fight monsters
		const usedGodMoves = getUsedGodMoves(me, opponent);
		const usedUltimateAttacks = me.fightActionsHistory.filter(action => action.id === FightConstants.FIGHT_ACTIONS.PLAYER.ULTIMATE_ATTACK).length;
		const divineAndUltimateAttacksUsed = usedGodMoves >= 2 && usedUltimateAttacks > 0;

		if (
			me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.DIVINE_ATTACK)
			&& (
				// Check if the opponent's last action is DIVINE_ATTACK and usedGodMoves is less than 2
				opponent.getLastFightActionUsed().id === FightConstants.FIGHT_ACTIONS.PLAYER.DIVINE_ATTACK
				&& usedGodMoves < 2
				||
				// Check if usedUltimateAttacks equals 1 and usedGodMoves is less than 2
				usedUltimateAttacks === 1
				&& usedGodMoves < 2
				||
				// Check if the opponent's class is one of [KNIGHT, VALIANT_KNIGHT, HORSE_RIDER, PIKEMAN, ESQUIRE],
				// A random chance of 0.2 succeeds, and no god moves have been used (usedGodMoves === 0)
				(opponent.player.class === ClassConstants.CLASSES_ID.KNIGHT
					|| opponent.player.class === ClassConstants.CLASSES_ID.VALIANT_KNIGHT
					|| opponent.player.class === ClassConstants.CLASSES_ID.HORSE_RIDER
					|| opponent.player.class === ClassConstants.CLASSES_ID.PIKEMAN
					|| opponent.player.class === ClassConstants.CLASSES_ID.ESQUIRE)
				&& RandomUtils.draftbotRandom.bool(0.2)
				&& usedGodMoves === 0
				||
				// Check if the opponent's class is PALADIN or LUMINOUS_PALADIN,
				// Ensure the last action was DIVINE_ATTACK, apply a random chance of 0.2,
				// Confirm no god moves have been used, and that the fight turn is at least 8
				(opponent.player.class === ClassConstants.CLASSES_ID.PALADIN
					|| opponent.player.class === ClassConstants.CLASSES_ID.LUMINOUS_PALADIN)
				&& (opponent.getLastFightActionUsed().id === FightConstants.FIGHT_ACTIONS.PLAYER.DIVINE_ATTACK
					|| RandomUtils.draftbotRandom.bool(0.2))
				&& usedGodMoves < 2
				&& fightView.fightController.turn >= 8
			)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.DIVINE_ATTACK);
		}

		// Ultimate attack if not already used and low enough in energy
		if (
			me.getEnergy() < me.getMaxEnergy() * 0.45
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_ULTIMATE_ATTACK)
			&& usedUltimateAttacks === 0
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_ULTIMATE_ATTACK);
		}

		// Shield attack will be more probable if the opponent has a lot of breath
		const breathRange = Math.round(opponent.getBreath() / opponent.getMaxBreath() * 5 / 3);
		// Shield attack to block opponent's two-turn attacks
		if (
			!opponent.hasFightAlteration()
			&& (me.getBreath() > 18
				|| divineAndUltimateAttacksUsed)
			&& (opponent.getLastFightActionUsed().id === FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_CHARGING_ATTACK
				|| opponent.getLastFightActionUsed().id === FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_ULTIMATE_ATTACK
				|| opponent.getDefense() > me.getDefense() * 0.9 && RandomUtils.draftbotRandom.bool([0.05, 0.2, 0.8][breathRange])
			)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.SHIELD_ATTACK);
		}

		// Ram attack to cancel opponent's two-turn attack (except CHARGE_CHARGING_ATTACK to avoid huge defense buff)
		if (
			!opponent.hasFightAlteration()
			&& (me.getBreath() > 17
				|| divineAndUltimateAttacksUsed
				|| opponent.getLastFightActionUsed().id === FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK
				&& opponent.getBreath() >= 2)
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.RAM_ATTACK)
			&& me.getEnergy() >= me.getMaxEnergy() * 0.15
			&& opponent.getLastFightActionUsed().id !== FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_CHARGING_ATTACK
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.RAM_ATTACK);
		}


		return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.SIMPLE_ATTACK);
	}
}

export default PaladinFightBehavior;