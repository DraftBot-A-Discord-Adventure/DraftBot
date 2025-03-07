import {FightView} from "./FightView";
import {FightAction} from "../../data/FightAction";
import {AiPlayerFighter} from "./fighter/AiPlayerFighter";
import {PlayerFighter} from "./fighter/PlayerFighter";
import ScareFishPetBehavior from "./petBehaviors/ScareFishPetBehavior";

export interface PetBehavior {
	chooseAction(fighter: AiPlayerFighter | PlayerFighter, fightView: FightView): FightAction;
}

// Map to store pet behaviors by pet ID
const petBehavior = new Map<number, PetBehavior>();

/**
 * Initialize all pet behaviors in a map so they can be accessed by pet ID
 */
export function initializeAllPetBehaviors(): void {
	registerPetBehavior(77, new ScareFishPetBehavior());
}

/**
 * Register a pet behavior
 * @param petId The pet ID
 * @param behavior The behavior implementation
 */
export function registerPetBehavior(petId: number, behavior: PetBehavior): void {
	petBehavior.set(petId, behavior);
}

/**
 * Get a pet behavior by pet ID
 * @param petId The pet ID
 * @returns The pet behavior or undefined if not found
 */
export function getAiPetBehavior(petId: number): PetBehavior | undefined {
	return petBehavior.get(petId);
}