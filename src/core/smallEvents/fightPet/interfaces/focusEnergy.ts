import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {RandomUtils} from "../../../utils/RandomUtils";

export default class FocusEnergy extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		// Chances of success is the ratio of remaining energy on total energy minus the rarity of the pet x 0,05
		return RandomUtils.draftbotRandom.realZeroToOneInclusive() <= await player.getCumulativeFightPoint() / await player.getMaxCumulativeFightPoint() - feralPet.originalPet.rarity * 0.05;
	}
}