import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {PlayerActiveObjects} from "../../../database/game/models/PlayerActiveObjects";
import {InventorySlots} from "../../../database/game/models/InventorySlot";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {Guild, Guilds} from "../../../database/game/models/Guild";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import {RandomUtils} from "../../../utils/RandomUtils";
import {TranslationModule} from "../../../Translations";

/**
 * The worm will give a random potion but cost a bit of time
 */
export default class FistHit extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet, translationModule: TranslationModule): Promise<string> {
		const playerActiveObjects: PlayerActiveObjects = await InventorySlots.getPlayerActiveObjects(player.id);
		if (await player.getCumulativeAttack(playerActiveObjects) > SmallEventConstants.FIGHT_PET.FIST_HIT_ATTACK_NEEDED * feralPet.originalPet.rarity) {
			const guild = await Guilds.getById(player.guildId);
			if (guild) {
				return await this.earnGuildPoints(guild, translationModule);
			}
			return translationModule.get(`fightPetActions.${this.name}.successWithoutGuild`);
		}
		const amount = await this.lowerEnergy(feralPet, player);
		return translationModule.format(`fightPetActions.${this.name}.failure`, {amount});
	}

	/**
	 * Give guild points to the guild of the player
	 * @param guild
	 * @param translationModule
	 * @private
	 */
	private async earnGuildPoints(guild: Guild, translationModule: TranslationModule) : Promise<string> {
		const amount = RandomUtils.draftbotRandom.integer(SmallEventConstants.FIGHT_PET.GUILD_SCORE_REWARDS.SMALL.MIN, SmallEventConstants.FIGHT_PET.GUILD_SCORE_REWARDS.SMALL.MAX);
		await guild.addScore(amount, NumberChangeReason.SMALL_EVENT);
		await guild.save();
		return translationModule.format(`fightPetActions.${this.name}.success`, {amount});
	}

	/**
	 * Lower the energy of the player
	 * @param feralPet
	 * @param player
	 * @private
	 */
	private async lowerEnergy(feralPet: FeralPet, player: Player) : Promise<number> {
		const minEnergyLoss = feralPet.originalPet.rarity >= SmallEventConstants.FIGHT_PET.FIST_HIT_HIGHER_DAMAGE_MINIMUM_RARITY ?
			SmallEventConstants.FIGHT_PET.ENERGY_LOSS.MEDIUM.MIN : SmallEventConstants.FIGHT_PET.ENERGY_LOSS.SMALL.MIN;
		const maxEnergyLoss = feralPet.originalPet.rarity >= SmallEventConstants.FIGHT_PET.FIST_HIT_HIGHER_DAMAGE_MINIMUM_RARITY ?
			SmallEventConstants.FIGHT_PET.ENERGY_LOSS.MEDIUM.MAX : SmallEventConstants.FIGHT_PET.ENERGY_LOSS.SMALL.MAX;
		const amount = RandomUtils.draftbotRandom.integer(minEnergyLoss, maxEnergyLoss);
		await player.addEnergy(-amount, NumberChangeReason.SMALL_EVENT);
		await player.save();
		return amount;
	}
}