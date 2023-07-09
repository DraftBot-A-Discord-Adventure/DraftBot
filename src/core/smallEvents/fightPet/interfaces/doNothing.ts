import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {RandomUtils} from "../../../utils/RandomUtils";

/**
 *  The player does nothing and hopes for the best
 */
export default class DoNothing extends FightPetAction {
	public applyOutcome(): boolean {
		return RandomUtils.draftbotRandom.bool(SmallEventConstants.FIGHT_PET.DO_NOTHING_VERY_LUCKY_THRESHOLD);
	}
}