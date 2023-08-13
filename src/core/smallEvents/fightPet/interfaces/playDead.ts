import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {RandomUtils} from "../../../utils/RandomUtils";

/**
 * Play dead if the health is low enough
 */
export default class PlayDead extends FightPetAction {

	public async applyOutcome(player: Player): Promise<boolean> {
		return RandomUtils.draftbotRandom.bool(1 - player.health / await player.getMaxHealth());
	}
}