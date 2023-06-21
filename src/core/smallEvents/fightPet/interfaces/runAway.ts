import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {PlayerActiveObjects} from "../../../database/game/models/PlayerActiveObjects";
import {InventorySlots} from "../../../database/game/models/InventorySlot";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {RandomUtils} from "../../../utils/RandomUtils";
import {TranslationModule} from "../../../Translations";

/**
 * The worm will give a random potion but cost a bit of time
 */
export default class RunAway extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet, translationModule: TranslationModule): Promise<string> {
		const playerActiveObjects: PlayerActiveObjects = await InventorySlots.getPlayerActiveObjects(player.id);
		if (await player.getCumulativeSpeed(playerActiveObjects) > SmallEventConstants.FIGHT_PET.RUN_AWAY_SPEED_BONUS_THRESHOLD * feralPet.originalPet.rarity) {
			return translationModule.get(`fightPetActions.${this.name}.success`);
		}
		const amount = await this.lowerEnergy(player);
		return translationModule.format(`fightPetActions.${this.name}.failure`, {amount});
	}

	/**
	 * Lower the energy of the player
	 * @param player
	 * @private
	 */
	private async lowerEnergy(player: Player) : Promise<number> {
		const amount = RandomUtils.draftbotRandom.integer(SmallEventConstants.FIGHT_PET.ENERGY_LOSS.SMALL.MIN, SmallEventConstants.FIGHT_PET.ENERGY_LOSS.SMALL.MAX);
		await player.addEnergy(-amount, NumberChangeReason.SMALL_EVENT);
		await player.save();
		return amount;
	}
}