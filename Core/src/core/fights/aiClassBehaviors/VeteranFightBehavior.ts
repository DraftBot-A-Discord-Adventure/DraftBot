import {ClassBehavior} from "../AiBehaviorManager";
import {AiPlayerFighter} from "../fighter/AiPlayerFighter";
import {FightView} from "../FightView";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {FightConstants} from "../../../../../Lib/src/constants/FightConstants";
import {PlayerFighter} from "../fighter/PlayerFighter";
import {ClassConstants} from "../../../../../Lib/src/constants/ClassConstants";
import {RandomUtils} from "../../../../../Lib/src/utils/RandomUtils";

class VeteranFightBehavior implements ClassBehavior {

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {

		const opponent = fightView.fightController.getDefendingFighter() as PlayerFighter | AiPlayerFighter; // AI will never fight monsters

		if (
			// Always use concentration on the first turn
			fightView.fightController.turn === 1
			// Other scenarios:
			|| !me.hasFightAlteration()
			&& RandomUtils.draftbotRandom.bool()
			&& me.getEnergy() > me.getMaxEnergy() * 0.15
			&& (
				[
					ClassConstants.CLASSES_ID.MYSTIC_MAGE,
					ClassConstants.CLASSES_ID.ROCK_THROWER,
					ClassConstants.CLASSES_ID.SLINGER,
					ClassConstants.CLASSES_ID.ARCHER,
					ClassConstants.CLASSES_ID.GUNNER,
					ClassConstants.CLASSES_ID.FORMIDABLE_GUNNER
				].includes(opponent.player.class)
				|| me.getBreath() === 7
				|| me.getBreath() === 8
			)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.CONCENTRATION);
		}

		if (
			me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.ENERGETIC_ATTACK)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.ENERGETIC_ATTACK);
		}

		// Use charging attack if enough breath and either:
		// 1. Opponent is charging a two-turn attack, OR
		// 2. Various tactical conditions are met and the opponent is not a knight
		if (me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_CHARGING_ATTACK) &&
			(
				// Condition 1: Opponent is charging a two-turn attack
				opponent.getLastFightActionUsed().id === FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_ULTIMATE_ATTACK
				|| opponent.getLastFightActionUsed().id === FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK && opponent.getBreath() >= 2
				|| opponent.getLastFightActionUsed().id === FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_CHARGING_ATTACK
				// Condition 2: Tactical advantage against non-knight opponents
				|| me.getEnergy() > me.getMaxEnergy() * 0.21
				&& opponent.getEnergy() > opponent.getMaxEnergy() * 0.16
				&& (opponent.player.class !== ClassConstants.CLASSES_ID.MYSTIC_MAGE || me.hasFightAlteration())
				&& opponent.player.class !== ClassConstants.CLASSES_ID.KNIGHT
				&& opponent.player.class !== ClassConstants.CLASSES_ID.VALIANT_KNIGHT
				&& opponent.player.class !== ClassConstants.CLASSES_ID.HORSE_RIDER
				&& opponent.player.class !== ClassConstants.CLASSES_ID.PIKEMAN
				&& opponent.player.class !== ClassConstants.CLASSES_ID.ESQUIRE
			)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_CHARGING_ATTACK);
		}

		// Use quick attack if the opponent has low speed
		if (
			opponent.getSpeed() < me.getSpeed() * 0.4
			|| RandomUtils.draftbotRandom.bool() && opponent.getSpeed() < me.getSpeed() * 0.6
			|| RandomUtils.draftbotRandom.bool(0.2)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.QUICK_ATTACK);
		}

		return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.PIERCING_ATTACK);
	}
}

export default VeteranFightBehavior;