import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {PlayerActiveObjects} from "../../../database/game/models/PlayerActiveObjects";
import {InventorySlots} from "../../../database/game/models/InventorySlot";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {RandomUtils} from "../../../utils/RandomUtils";
import {Translations} from "../../../Translations";

/**
 * The worm will give a random potion but cost a bit of time
 */
export default class RunAway extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet, language: string): Promise<string> {
		const playerActiveObjects: PlayerActiveObjects = await InventorySlots.getPlayerActiveObjects(player.id);
		if (await player.getCumulativeSpeed(playerActiveObjects) > SmallEventConstants.FIGHT_PET.RUN_AWAY_SPEED_BONUS_THRESHOLD * feralPet.originalPet.rarity) {
			return Translations.getModule("smallEvents.fightPet", language).get("fightPetActions.runAway.success");
		}
		const amount = await this.lowerEnergy(feralPet, player);
		return Translations.getModule("smallEvents.fightPet", language).format("fightPetActions.runAway.failure", {amount});
	}

	/**
	 * Lower the energy of the player
	 * @param feralPet
	 * @param player
	 * @private
	 */
	private async lowerEnergy(feralPet: FeralPet, player: Player) : Promise<number> {
		const amount = RandomUtils.draftbotRandom.integer(SmallEventConstants.FIGHT_PET.ENERGY_LOSS.SMALL.MIN, SmallEventConstants.FIGHT_PET.ENERGY_LOSS.SMALL.MAX);
		await player.addEnergy(-amount, NumberChangeReason.SMALL_EVENT);
		await player.save();
		return amount;
	}
}