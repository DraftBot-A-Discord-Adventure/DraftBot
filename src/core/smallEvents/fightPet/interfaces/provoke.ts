import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {InventorySlots} from "../../../database/game/models/InventorySlot";
import {ItemConstants} from "../../../constants/ItemConstants";

/**
 *  Provoke it
 */
export default class Provoke extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		// Réussit si le joueur a une attaque supérieure à son niveau fois la rareté de l'animal et si random > niveau /100 OU si le joueur possède l'objet "injures" dans son inventaire
		return await player.getCumulativeAttack(await InventorySlots.getMainSlotsItems(player.id)) >= player.level * feralPet.originalPet.rarity && Math.random() > player.level / 100
			|| await InventorySlots.hasItem(player.id, 83, ItemConstants.CATEGORIES.WEAPON);
	}
}