import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {InventorySlots} from "../../../database/game/models/InventorySlot";
import {ItemConstants} from "../../../constants/ItemConstants";
import {RandomUtils} from "../../../utils/RandomUtils";

/**
 *  Provoke it
 */
export default class Provoke extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		// Succeeds if the player has an attack greater than his level times the rarity of the animal and if random > level / 100 OR if the player has the "insults" object in his inventory
		return await player.getCumulativeAttack(
			await InventorySlots.getMainSlotsItems(player.id)) >= player.level * feralPet.originalPet.rarity
			&& RandomUtils.draftbotRandom.realZeroToOneInclusive() > player.level / 100
			|| await InventorySlots.hasItem(player.id, 83, ItemConstants.CATEGORIES.WEAPON);
	}
}