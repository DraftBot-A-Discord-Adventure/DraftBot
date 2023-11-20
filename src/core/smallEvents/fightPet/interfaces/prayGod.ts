import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {InventorySlots} from "../../../database/game/models/InventorySlot";
import {ItemConstants} from "../../../constants/ItemConstants";
import {RandomUtils} from "../../../utils/RandomUtils";

/**
 *  The player prays god to not be attacked by the feral pet
 */
export default class PrayGod extends FightPetAction {

	async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		// This action has 10% times how many holy items the player has times the rarity of the pet
		return RandomUtils.draftbotRandom.realZeroToOneInclusive() <
			SmallEventConstants.FIGHT_PET.PRAYER_CHANCE * feralPet.originalPet.rarity *
			await InventorySlots.countObjectsOfPlayer(player.id, ItemConstants.TAGS.HOLY)
			+ SmallEventConstants.FIGHT_PET.HAS_AN_HOLY_ATTACK_CHANCE * (player.hasHolyClass() ? 1 : 0);
	}
}