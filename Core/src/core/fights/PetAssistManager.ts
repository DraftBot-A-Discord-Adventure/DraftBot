import {PetAssistance, PetAssistanceDataController} from "../../data/PetAssistance";
import {FightConstants} from "../../../../Lib/src/constants/FightConstants";
import {PetConstants} from "../../../../Lib/src/constants/PetConstants";

// Map to store pet behaviors by pet ID
const petAssistanceList = new Map<number, PetAssistance>();

/**
 * Initialize all pet behaviors in a map so they can be accessed by pet ID
 */
export function initializeAllPetBehaviors(): void {
	registerPetBehavior(PetConstants.PETS.SHARK, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.SCARE_FISH));
	registerPetBehavior(PetConstants.PETS.FISH, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.FISH_PROTECT_AGAINST_FIRE));
	registerPetBehavior(PetConstants.PETS.TROPICAL_FISH, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.FISH_PROTECT_AGAINST_FIRE));
	registerPetBehavior(PetConstants.PETS.PUFFERFISH, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.FISH_PROTECT_AGAINST_FIRE));
	registerPetBehavior(PetConstants.PETS.DOLPHIN, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.FISH_PROTECT_AGAINST_FIRE));
	registerPetBehavior(PetConstants.PETS.LION, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.CLAWS));
	registerPetBehavior(PetConstants.PETS.TIGER, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.CLAWS));
	registerPetBehavior(PetConstants.PETS.LEOPARD, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.CLAWS));
	registerPetBehavior(PetConstants.PETS.DRAGON, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.SPIT_FIRE));
	registerPetBehavior(PetConstants.PETS.CAT, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.SMALL_CLAWS));
	registerPetBehavior(PetConstants.PETS.BADGER, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.SMALL_CLAWS));
	registerPetBehavior(PetConstants.PETS.BLACK_CAT, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.SMALL_CLAWS));
	registerPetBehavior(PetConstants.PETS.DOG, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.BITE));
	registerPetBehavior(PetConstants.PETS.POODLE, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.BITE));
	registerPetBehavior(PetConstants.PETS.FOX, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.BITE));
	registerPetBehavior(PetConstants.PETS.WOLF, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.BITE));
	registerPetBehavior(PetConstants.PETS.CROCODILE, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.BITE));
}

/**
 * Register a pet behavior
 * @param petId The pet ID
 * @param behavior The behavior implementation
 */
export function registerPetBehavior(petId: number, behavior: PetAssistance): void {
	petAssistanceList.set(petId, behavior);
}

/**
 * Get a pet behavior by pet ID
 * @param petId The pet ID
 * @returns The pet behavior or undefined if not found
 */
export function getAiPetBehavior(petId: number): PetAssistance | undefined {
	return petAssistanceList.get(petId);
}