import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {PlayerActiveObjects} from "../../../database/game/models/PlayerActiveObjects";
import {InventorySlots} from "../../../database/game/models/InventorySlot";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";

/**
 * The worm will give a random potion but cost a bit of time
 */
export default class RunAway extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		const playerActiveObjects: PlayerActiveObjects = await InventorySlots.getPlayerActiveObjects(player.id);
		return await player.getCumulativeSpeed(playerActiveObjects) > SmallEventConstants.FIGHT_PET.RUN_AWAY_SPEED_BONUS_THRESHOLD * feralPet.originalPet.rarity;
	}
}