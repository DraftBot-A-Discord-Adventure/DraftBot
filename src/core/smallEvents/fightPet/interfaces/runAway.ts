import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {PlayerActiveObjects} from "../../../database/game/models/PlayerActiveObjects";
import {InventorySlots} from "../../../database/game/models/InventorySlot";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {RandomUtils} from "../../../utils/RandomUtils";

/**
 * Run away from the fight if the player is fast enough
 */
export default class RunAway extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		const playerActiveObjects: PlayerActiveObjects = await InventorySlots.getPlayerActiveObjects(player.id);
		return RandomUtils.draftbotRandom.bool(
			Math.max(
				await player.getCumulativeSpeed(playerActiveObjects) / SmallEventConstants.FIGHT_PET.RUN_AWAY_SPEED_BONUS_THRESHOLD * feralPet.originalPet.rarity,
				SmallEventConstants.FIGHT_PET.MAXIMUM_STATS_BASED_ACTIONS_CHANCES
			)
		);
	}
}