import { ClassBehavior } from "../AiBehaviorManager";
import { AiPlayerFighter } from "../fighter/AiPlayerFighter";
import { FightView } from "../FightView";
import { FightAction, FightActionDataController } from "../../../data/FightAction";
import { FightConstants } from "../../../../../Lib/src/constants/FightConstants";
import { PlayerFighter } from "../fighter/PlayerFighter";
import { ClassConstants } from "../../../../../Lib/src/constants/ClassConstants";
import { RandomUtils } from "../../../../../Lib/src/utils/RandomUtils";

class InfantryManFightBehavior implements ClassBehavior {

	private powerfulAttacksUsed = 0;

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {
		const opponent = fightView.fightController.getDefendingFighter() as PlayerFighter | AiPlayerFighter; // AI will never fight monsters

		// If opponent is a mage, or a gunner with a lot of breath and we are not protected, use protection
		if (
			opponent.player.class === ClassConstants.CLASSES_ID.MYSTIC_MAGE
			|| (
				opponent.player.class === ClassConstants.CLASSES_ID.GUNNER
				&& opponent.getBreath() > 4
			)
			&& !me.hasFightAlteration()
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.PROTECTION);
		}

		// priority is to use powerful attacks
		if (
			this.powerfulAttacksUsed <= 2
			&& RandomUtils.draftbotRandom.bool(0.9) // add a bit of randomness here to avoid being too predictable
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.POWERFUL_ATTACK)
		) {
			this.powerfulAttacksUsed++;
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.POWERFUL_ATTACK);
		}

		// Use charging attack if the opponent is not a knight and we have enough breath
		if (
			(fightView.fightController.turn > 11 // except if we are late fight
				|| this.powerfulAttacksUsed > 2) // keep saving breath before using charging attack
			&& opponent.player.class !== ClassConstants.CLASSES_ID.KNIGHT
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_CHARGING_ATTACK)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_CHARGING_ATTACK);
		}

		// Use piercing attack if the opponent has high defense
		if (
			opponent.getDefense() > me.getDefense()
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.PIERCING_ATTACK)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.PIERCING_ATTACK);
		}

		// Fallback to simple attack or protection if not enough breath
		if (
			me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.SIMPLE_ATTACK)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.SIMPLE_ATTACK);
		}

		return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.PROTECTION);
	}
}

export default InfantryManFightBehavior;