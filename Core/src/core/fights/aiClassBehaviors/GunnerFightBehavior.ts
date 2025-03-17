import {ClassBehavior} from "../AiBehaviorManager";
import {AiPlayerFighter} from "../fighter/AiPlayerFighter";
import {FightView} from "../FightView";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {FightConstants} from "../../../../../Lib/src/constants/FightConstants";

class GunnerFightBehavior implements ClassBehavior {
	// WeakMaps to store fighter-specific state
	private isGoingForChainedCanonAttackMap = new WeakMap<AiPlayerFighter, boolean>();

	private canonAttackUsedMap = new WeakMap<AiPlayerFighter, number>();

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {
		const opponent = fightView.fightController.getDefendingFighter();

		// Get a fighter-specific state or initialize if not set
		let isGoingForChainedCanonAttack = this.isGoingForChainedCanonAttackMap.get(me) || false;
		let canonAttackUsed = this.canonAttackUsedMap.get(me) || 0;

		// Use canon attack again if used last turn to get 1.5x damage
		if (
			fightView.fightController.turn > 2
			&& isGoingForChainedCanonAttack
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK)
			&& canonAttackUsed <= 2
		) {
			canonAttackUsed++;
			this.canonAttackUsedMap.set(me, canonAttackUsed);
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK);
		}

		// Clear the chained canon attack flag if 3 canon attacks have been used (or 2 and not enough breath to continue)
		if (
			isGoingForChainedCanonAttack
			&& (canonAttackUsed >= 3
				|| me.getBreath() < FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK)
				&& canonAttackUsed === 2)
		) {
			isGoingForChainedCanonAttack = false;
			this.isGoingForChainedCanonAttackMap.set(me, false);
		}

		// If opponent is very low health, finish them with any attack
		if (opponent.getEnergy() <= 50) {
			// Quick Attack is good for finishing off enemies
			if (me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.QUICK_ATTACK)) {
				return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.QUICK_ATTACK);
			}
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.SABOTAGE_ATTACK);
		}

		// Play boomerang when possible if the opponent has no alteration
		if (
			!opponent.hasFightAlteration()
			&& !isGoingForChainedCanonAttack
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.BOOMERANG_ATTACK)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.BOOMERANG_ATTACK);
		}

		// After a boomerang, decide to focus on canon attack strategy we have enough breath, use canon attack
		if (
			!isGoingForChainedCanonAttack
			&& canonAttackUsed === 0
			&& opponent.getEnergy() > 400
			&& opponent.hasFightAlteration()
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK)
		) {
			isGoingForChainedCanonAttack = true;
			this.isGoingForChainedCanonAttackMap.set(me, true);

			// We need to have enough breath to use canon attack twice in a raw at minimum
			if (me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK) + 2) {
				canonAttackUsed++;
				this.canonAttackUsedMap.set(me, canonAttackUsed);
				return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK);
			}
		}

		// If the opponent has higher speed or close to it, and we have enough breath, use intense attack
		if (
			!isGoingForChainedCanonAttack
			&& opponent.getSpeed() > me.getSpeed() * 0.8
			&& opponent.getEnergy() > 200
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.INTENSE_ATTACK)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.INTENSE_ATTACK);
		}

		// If the opponent has higher speed or close to it, and we don't have breath for intense, use sabotage attack
		if (
			opponent.getSpeed() > me.getSpeed() * 0.8
			&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.SABOTAGE_ATTACK)
		) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.SABOTAGE_ATTACK);
		}

		// Quick attack in other scenarios
		return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.QUICK_ATTACK);
	}
}

export default GunnerFightBehavior;