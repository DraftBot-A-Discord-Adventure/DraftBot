import {PetAssistance, PetAssistanceDataController} from "../../data/PetAssistance";
import {FightConstants} from "../../../../Lib/src/constants/FightConstants";

// Map to store pet behaviors by pet ID
const petAssistanceList = new Map<number, PetAssistance>();

/**
 * Initialize all pet behaviors in a map so they can be accessed by pet ID
 */
export function initializeAllPetBehaviors(): void {
	registerPetBehavior(77, PetAssistanceDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PET.SCARE_FISH));
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