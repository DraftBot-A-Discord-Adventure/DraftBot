import {FightPetAction} from "../FightPetAction";
import Player from "../../../database/game/models/Player";
import {FeralPet} from "../../../database/game/models/FeralPet";
import {SmallEventConstants} from "../../../constants/SmallEventConstants";
import {Pets} from "../../../database/game/models/Pet";
import {RandomUtils} from "../../../utils/RandomUtils";
import {PetEntities} from "../../../database/game/models/PetEntity";
import {PetConstants} from "../../../constants/PetConstants";
import {PetEntityConstants} from "../../../constants/PetEntityConstants";

/**
 *  Allow the player to use his pet in the fight
 */
export default class UsePlayerPet extends FightPetAction {

	public async applyOutcome(player: Player, feralPet: FeralPet): Promise<boolean> {
		const playerPetEntity = await PetEntities.getById(player.petId);
		if (!playerPetEntity) {
			return false; // Player doesn't have a pet, so cannot use one in the fight
		}

		const playerPet = await Pets.getById(playerPetEntity.petId);

		const petLoveBonusOrMalus = playerPetEntity.getLoveLevelNumber() === PetConstants.LOVE_LEVEL.TRAINED
			? SmallEventConstants.FIGHT_PET.BONUS_FOR_TRAINED_PETS
			: playerPetEntity.getLoveLevelNumber() === PetConstants.LOVE_LEVEL.FEISTY
				? SmallEventConstants.FIGHT_PET.MALUS_FOR_FEISTY_PETS
				: 0;

		const dietBonusOrMalus = feralPet.originalPet.diet === PetEntityConstants.RESTRICTIVES_DIETS.CARNIVOROUS && playerPet.diet === PetEntityConstants.RESTRICTIVES_DIETS.HERBIVOROUS
			? SmallEventConstants.FIGHT_PET.MALUS_FOR_WRONG_DIET
			: feralPet.originalPet.diet === PetEntityConstants.RESTRICTIVES_DIETS.HERBIVOROUS && playerPet.diet === PetEntityConstants.RESTRICTIVES_DIETS.CARNIVOROUS
				? SmallEventConstants.FIGHT_PET.BONUS_FOR_RIGHT_DIET
				: 0;

		// Calculate the success probability using the rarity factors
		const successProbability =
			SmallEventConstants.FIGHT_PET.BASE_PET_FIGHTS_SUCCESS_RATE +
			(SmallEventConstants.FIGHT_PET.PLAYERS_RARITY_BONUS_BOOST + petLoveBonusOrMalus + dietBonusOrMalus + playerPet.rarity - feralPet.originalPet.rarity)
			* SmallEventConstants.FIGHT_PET.SUCCESS_PROBABILITY_FOR_RARITY_DIFFERENCE;

		// Ensure the success probability is within a reasonable range
		const clampedSuccessProbability = Math.max(SmallEventConstants.FIGHT_PET.MIN_PROBABILITY_PET_VS_PET, Math.min(SmallEventConstants.FIGHT_PET.MAX_PROBABILITY_PET_VS_PET, successProbability));

		return RandomUtils.draftbotRandom.realZeroToOneInclusive() <= clampedSuccessProbability;
	}
}