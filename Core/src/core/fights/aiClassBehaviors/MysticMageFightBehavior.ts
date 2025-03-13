import {ClassBehavior} from "../AiBehaviorManager";
import {AiPlayerFighter} from "../fighter/AiPlayerFighter";
import {FightView} from "../FightView";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {FightConstants} from "../../../../../Lib/src/constants/FightConstants";

class MysticMageFightBehavior implements ClassBehavior {
	private poisonTurns = 0;

	private cursedAttackUsed = false;

	private lastHadPoison = false;

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {
		const opponent = fightView.fightController.getDefendingFighter();
		const actions = FightConstants.FIGHT_ACTIONS.PLAYER;

		// Check if the opponent has poison or any alteration
		const opponentHasAlteration = opponent.hasFightAlteration();
		const isPoisonActive = opponentHasAlteration && opponent.alteration.id === FightConstants.FIGHT_ACTIONS.ALTERATION.POISONED;

		// Track poison duration
		if (isPoisonActive) {
			this.poisonTurns++;
			this.lastHadPoison = true;
		}
		else if (this.lastHadPoison) {
			this.poisonTurns = 0;
			this.lastHadPoison = false;
		}

		// --- ENDGAME STRATEGIES (highest priority) ---

		// Dark attack if dying soon, or opponent has way more attack than me
		if (me.getEnergy() < 150 && opponent.getEnergy() > 150 || opponent.getAttack() > me.getAttack() * 1.2 && me.getBreath() >= 5) {
			return FightActionDataController.instance.getById(actions.DARK_ATTACK);
		}

		// Fire attack if enough breath and no alteration
		if (!opponentHasAlteration && me.getBreath() >= 8) {
			return FightActionDataController.instance.getById(actions.FIRE_ATTACK);
		}

		// Poison attack if opponent < 65 HP (with conditions)
		if (opponent.getEnergy() < 65 && this.poisonTurns > 3 && me.getBreath() < 6 && me.getBreath() >= 3) {
			return FightActionDataController.instance.getById(actions.POISONOUS_ATTACK);
		}

		// Cursed attack if turn > 15, no alteration and enough breath, only one per fight
		if (!this.cursedAttackUsed && me.getBreath() >= 6 && !opponentHasAlteration && fightView.fightController.turn > 15) {
			this.cursedAttackUsed = true;
			return FightActionDataController.instance.getById(actions.CURSED_ATTACK);
		}

		// --- STANDARD STRATEGIES ---

		// Start with poison or reapply when it stops (if no other alteration)
		if (!isPoisonActive && !opponentHasAlteration && me.getBreath() >= 3) {
			return FightActionDataController.instance.getById(actions.POISONOUS_ATTACK);
		}

		// Dark attack whenever possible
		if (me.getBreath() >= 6) {
			return FightActionDataController.instance.getById(actions.DARK_ATTACK);
		}

		// Default to breathtaking attack
		return FightActionDataController.instance.getById(actions.BREATH_TAKING_ATTACK);
	}

}

export default MysticMageFightBehavior;