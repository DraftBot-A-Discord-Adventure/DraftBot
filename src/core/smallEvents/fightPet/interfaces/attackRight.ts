import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {RandomUtils} from "../../../utils/RandomUtils";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

export default class AttackRight extends FightPetAction {

	public applyOutcome(player: Player): boolean {
		const lastChar = player.discordUserId.charAt(player.discordUserId.length - 1);
		return RandomUtils.draftbotRandom.realZeroToOneInclusive() <
			(
				lastChar !== SmallEventConstants.FIGHT_PET.LAST_DIGIT_LEFT_HANDED
					? SmallEventConstants.FIGHT_PET.LEFT_RIGHT_GOOD_SIDE_CHANCES
					: SmallEventConstants.FIGHT_PET.LEFT_RIGHT_WRONG_SIDE_CHANCES
			);
	}
}