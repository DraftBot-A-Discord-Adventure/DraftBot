import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {RandomUtils} from "../../../utils/RandomUtils";

export default class FocusEnergy extends FightPetAction {

	// eslint-disable-next-line require-await
	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		// Chances of success is the level of the player minus 5 x pet rarity divided by 100
		return RandomUtils.draftbotRandom.realZeroToOneInclusive() <= (player.level - feralPet.originalPet.rarity * 5) / 100;
	}
}