import {ClassBehavior} from "../AiBehaviorManager";
import {AiPlayerFighter} from "../fighter/AiPlayerFighter";
import {FightView} from "../FightView";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {FightConstants} from "../../../../../Lib/src/constants/FightConstants";

class MysticMageFightBehavior implements ClassBehavior {
	private poisonTurns: number = 0;

	private lastHadPoison: boolean = false;

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

		// Dark attack if dying soon
		if (me.getEnergy() < 150 && opponent.getEnergy() > 150) {
			return FightActionDataController.instance.getById(actions.DARK_ATTACK);
		}

		// Fire attack if opponent has 240-290 HP and poison stopped
		if (opponent.getEnergy() >= 240 && opponent.getEnergy() <= 290 && !isPoisonActive && me.getBreath() >= 8) {
			return FightActionDataController.instance.getById(actions.FIRE_ATTACK);
		}

		// Poison attack if opponent < 65 HP (with conditions)
		if (opponent.getEnergy() < 65 && this.poisonTurns > 3 && me.getBreath() < 6 && me.getBreath() >= 3) {
			return FightActionDataController.instance.getById(actions.POISONOUS_ATTACK);
		}

		// Cursed attack if opponent <= 150 HP
		if (opponent.getEnergy() <= 150 && (me.getBreath() >= 6 || me.getEnergy() < 150)) {
			return FightActionDataController.instance.getById(actions.CURSED_ATTACK);
		}

		// --- STANDARD STRATEGIES ---

		// Start with poison or reapply when it stops (if no other alteration)
		if (!isPoisonActive && !opponentHasAlteration && me.getBreath() >= 3) {
			return FightActionDataController.instance.getById(actions.POISONOUS_ATTACK);
		}

		// Dark attack whenever possible
		if (me.getBreath() >= 8) {
			return FightActionDataController.instance.getById(actions.DARK_ATTACK);
		}

		// Default to breathtaking attack
		return FightActionDataController.instance.getById(actions.BREATH_TAKING_ATTACK);
	}

}

export default MysticMageFightBehavior;