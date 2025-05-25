import { ClassBehavior } from "../AiBehaviorController";
import { AiPlayerFighter } from "../fighter/AiPlayerFighter";
import { FightView } from "../FightView";
import {
	FightAction, FightActionDataController
} from "../../../data/FightAction";
import { FightConstants } from "../../../../../Lib/src/constants/FightConstants";
import { PlayerFighter } from "../fighter/PlayerFighter";
import { ClassConstants } from "../../../../../Lib/src/constants/ClassConstants";
import { RandomUtils } from "../../../../../Lib/src/utils/RandomUtils";
import {
	piercingOrSimpleAttack, shouldProtect
} from "./RecruitFightBehavior";

class InfantryManFightBehavior implements ClassBehavior {
	private powerfulAttacksUsedMap = 0;

	private shouldUseChargingAttack(me: AiPlayerFighter, opponent: PlayerFighter | AiPlayerFighter, fightView: FightView, powerfulAttacksUsed: number): boolean {
		const opponentLastAction = opponent.getLastFightActionUsed();

		// Condition 1: Opponent is charging a two-turn attack
		const opponentIsCharging = opponentLastAction && (
			opponentLastAction.id === FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_ULTIMATE_ATTACK
			|| (opponentLastAction.id === FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK && opponent.getBreath() >= 2)
			|| opponentLastAction.id === FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_CHARGING_ATTACK
		);

		if (opponentIsCharging) {
			return true;
		}

		// Condition 2: Tactical advantage against non-knight opponents
		const tacticalAdvantage = (fightView.fightController.turn > 11 || powerfulAttacksUsed > 2)
			&& me.getEnergy() > me.getMaxEnergy() * 0.21
			&& (opponent.player.class !== ClassConstants.CLASSES_ID.MYSTIC_MAGE || me.hasFightAlteration())
			&& (RandomUtils.draftbotRandom.bool() || opponent.getDefense() < me.getDefense());

		const opponentIsNotKnightLike = opponent.player.class !== ClassConstants.CLASSES_ID.KNIGHT
			&& opponent.player.class !== ClassConstants.CLASSES_ID.VALIANT_KNIGHT
			&& opponent.player.class !== ClassConstants.CLASSES_ID.HORSE_RIDER
			&& opponent.player.class !== ClassConstants.CLASSES_ID.PIKEMAN
			&& opponent.player.class !== ClassConstants.CLASSES_ID.ESQUIRE;

		return tacticalAdvantage && opponentIsNotKnightLike;
	}

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {
		const powerfulAttacksUsed = this.powerfulAttacksUsedMap;
		const opponent = fightView.fightController.getDefendingFighter() as PlayerFighter | AiPlayerFighter; // AI will never fight monsters

		if (shouldProtect(opponent, me, fightView.fightController.turn)) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.PROTECTION);
		}

		// Priority is to use powerful attacks
		if (
			powerfulAttacksUsed <= 2
			&& RandomUtils.draftbotRandom.bool(0.9) // Add a bit of randomness here to avoid being too predictable
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.POWERFUL_ATTACK)
		) {
			this.powerfulAttacksUsedMap++;
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.POWERFUL_ATTACK);
		}

		if (me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_CHARGING_ATTACK)
			&& this.shouldUseChargingAttack(me, opponent, fightView, powerfulAttacksUsed)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_CHARGING_ATTACK);
		}

		return piercingOrSimpleAttack(opponent, me);
	}
}

export default InfantryManFightBehavior;
