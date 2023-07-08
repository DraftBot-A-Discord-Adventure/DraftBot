import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {RandomUtils} from "../../../utils/RandomUtils";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

export default class AttackRight extends FightPetAction {

	public applyOutcome(player: Player): Promise<boolean> {
		const lastChar = player.discordUserId.charAt(player.discordUserId.length - 1);
		return Promise.resolve(RandomUtils.draftbotRandom.realZeroToOneInclusive() <
			(
				lastChar === "0" || lastChar === "2" || lastChar === "4" || lastChar === "6" || lastChar === "8" ?
					SmallEventConstants.FIGHT_PET.LEFT_RIGHT_WRONG_SIDE_CHANCES
					: SmallEventConstants.FIGHT_PET.LEFT_RIGHT_GOOD_SIDE_CHANCES
			)
		);
	}
}