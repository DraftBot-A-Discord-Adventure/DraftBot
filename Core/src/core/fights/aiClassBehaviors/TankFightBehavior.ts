import {ClassBehavior} from "../AiBehaviorManager";
import {AiPlayerFighter} from "../fighter/AiPlayerFighter";
import {FightView} from "../FightView";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {FightConstants} from "../../../../../Lib/src/constants/FightConstants";
import {RandomUtils} from "../../../../../Lib/src/utils/RandomUtils";
import {PlayerFighter} from "../fighter/PlayerFighter";
import {ClassConstants} from "../../../../../Lib/src/constants/ClassConstants";

class TankFightBehavior implements ClassBehavior {

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {
		const opponent = fightView.fightController.getDefendingFighter() as AiPlayerFighter | PlayerFighter;
		const turn = fightView.fightController.turn;

		if (
			(me.getDefense() < 600
				|| RandomUtils.draftbotRandom.bool(0.1))
			&& turn < 3
			&& ![
				ClassConstants.CLASSES_ID.KNIGHT,
				ClassConstants.CLASSES_ID.VALIANT_KNIGHT,
				ClassConstants.CLASSES_ID.PIKEMAN,
				ClassConstants.CLASSES_ID.ESQUIRE,
				ClassConstants.CLASSES_ID.HORSE_RIDER
			].includes(opponent.player.class)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.DEFENSE_BUFF);
		}

		if (
			([
				FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_ULTIMATE_ATTACK,
				FightConstants.FIGHT_ACTIONS.PLAYER.CHARGE_CHARGING_ATTACK,
				FightConstants.FIGHT_ACTIONS.PLAYER.BOOMERANG_ATTACK,
				FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK
			].includes(opponent.getLastFightActionUsed().id)
				|| opponent.getBreath() > opponent.getMaxBreath() * 0.85)
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.SHIELD_ATTACK)
			&& RandomUtils.draftbotRandom.bool(0.8)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.SHIELD_ATTACK);
		}

		if (
			turn > 1
			&& !FightConstants.UNCOUNTERABLE_ACTIONS.includes(opponent.getLastFightActionUsed().id)
			&& opponent.getLastFightActionUsed().id !== FightConstants.FIGHT_ACTIONS.PLAYER.HEAVY_ATTACK
			&& FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.COUNTER_ATTACK)
			&& opponent.getLastFightActionUsed().breath > 4 // Don't copy attacks that cost a small amount of breath
			&& RandomUtils.draftbotRandom.bool(0.8)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.COUNTER_ATTACK);
		}

		if (
			me.getEnergy() < opponent.getEnergy()
			&& opponent.getEnergy() > opponent.getMaxEnergy() * 0.15
			&& FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.INTENSE_ATTACK)
			&& RandomUtils.draftbotRandom.bool(0.8)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.INTENSE_ATTACK);
		}

		// Any other case, use a simple attack
		return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.SIMPLE_ATTACK);
	}
}

export default TankFightBehavior;