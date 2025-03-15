import { ClassBehavior } from "../AiBehaviorManager";
import { AiPlayerFighter } from "../fighter/AiPlayerFighter";
import { FightView } from "../FightView";
import { FightAction, FightActionDataController } from "../../../data/FightAction";
import { FightConstants } from "../../../../../Lib/src/constants/FightConstants";

class MysticMageFightBehavior implements ClassBehavior {

	private cursedAttackUsed = false;

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {
		const opponent = fightView.fightController.getDefendingFighter();
		const actions = FightConstants.FIGHT_ACTIONS.PLAYER;

		// Dark attack if dying soon, or opponent has way more attack than me
		if (
			me.getEnergy() < 150 && opponent.getEnergy() > 300
			|| (opponent.getAttack() > me.getAttack() * 1.4
				&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.DARK_ATTACK))
		) {
			return FightActionDataController.instance.getById(actions.DARK_ATTACK);
		}

		// Fire attack if enough breath and no alteration (except during first 5 turns)
		// After turn 13, skip if cursed attack has not been used
		if (
			!opponent.hasFightAlteration()
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.FIRE_ATTACK)
			&& fightView.fightController.turn > 5
			&& (fightView.fightController.turn <= 13 || this.cursedAttackUsed)) {
			return FightActionDataController.instance.getById(actions.FIRE_ATTACK);
		}

		// Poison attack if opponent < 65 HP or if we are in the first 5 turns and no alteration
		if (
			opponent.getEnergy() < 65
			&& me.getBreath() < FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.POISONOUS_ATTACK) + 3
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.POISONOUS_ATTACK)
			|| fightView.fightController.turn <= 6
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.POISONOUS_ATTACK)
			&& !opponent.hasFightAlteration()
		) {
			return FightActionDataController.instance.getById(actions.POISONOUS_ATTACK);
		}

		// Cursed attack if turn > 13, no alteration and enough breath, only one per fight
		if (
			!this.cursedAttackUsed
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.CURSED_ATTACK)
			&& !opponent.hasFightAlteration()
			&& fightView.fightController.turn > 13
		) {
			this.cursedAttackUsed = true;
			return FightActionDataController.instance.getById(actions.CURSED_ATTACK);
		}

		// Dark attack whenever possible
		if (me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.DARK_ATTACK)) {
			return FightActionDataController.instance.getById(actions.DARK_ATTACK);
		}

		// Default to breathtaking attack
		return FightActionDataController.instance.getById(actions.BREATH_TAKING_ATTACK);
	}

}

export default MysticMageFightBehavior;