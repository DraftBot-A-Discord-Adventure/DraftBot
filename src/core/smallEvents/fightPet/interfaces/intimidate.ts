import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {RandomUtils} from "../../../utils/RandomUtils";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

/**
 * Focus energy if the player is high level, this has more chances to succeed
 */
export default class Intimidate extends FightPetAction {

	// eslint-disable-next-line require-await
	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		// Chances of success is based on the level of the player and the rarity of the pet
		return RandomUtils.draftbotRandom.realZeroToOneInclusive() <=
			Math.max(
				Math.min(SmallEventConstants.FIGHT_PET.INTIMIDATE_MAXIMUM_LEVEL, player.level) - feralPet.originalPet.rarity * SmallEventConstants.FIGHT_PET.INTIMIDATE_RARITY_MULTIPLIER, 0
			) / 100;
	}
}