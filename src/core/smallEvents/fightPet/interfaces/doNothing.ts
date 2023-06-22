import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {RandomUtils} from "../../../utils/RandomUtils";

/**
 *  The player does nothing and hopes for the best
 */
export default class DoNothing extends FightPetAction {

	// eslint-disable-next-line @typescript-eslint/no-unused-vars,require-await
	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.FIGHT_PET.DO_NOTHING_VERY_LUCKY_THRESHOLD);
	}
}