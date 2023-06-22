import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {RandomUtils} from "../../../utils/RandomUtils";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

/**
 * Focus energy if the player has low level of energy, this has more chances to succeed
 */
export default class LastEffort extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		// Chances of success is the ratio of remaining energy on total energy minus the rarity of the pet
		return RandomUtils.draftbotRandom.realZeroToOneInclusive() <=
			1 - await player.getCumulativeFightPoint() / await player.getMaxCumulativeFightPoint()
			- feralPet.originalPet.rarity * SmallEventConstants.FIGHT_PET.ENERGY_BASED_ACTIONS_RARITY_MULTIPLIER;
	}
}