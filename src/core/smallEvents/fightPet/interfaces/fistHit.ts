import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {PlayerActiveObjects} from "../../../database/game/models/PlayerActiveObjects";
import {InventorySlots} from "../../../database/game/models/InventorySlot";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {RandomUtils} from "../../../utils/RandomUtils";

/**
 * Hit the pet with the fist, this works better if the player has a lot of strength
 */
export default class FistHit extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		const playerActiveObjects: PlayerActiveObjects = await InventorySlots.getPlayerActiveObjects(player.id);
		return RandomUtils.draftbotRandom.bool(
			Math.max(
				await player.getCumulativeAttack(playerActiveObjects) / SmallEventConstants.FIGHT_PET.FIST_HIT_ATTACK_NEEDED * feralPet.originalPet.rarity,
				SmallEventConstants.FIGHT_PET.MAXIMUM_STATS_BASED_ACTIONS_CHANCES
			)
		);
	}
}