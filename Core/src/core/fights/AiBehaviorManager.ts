
import {FightView} from "./FightView";
import {FightAction} from "../../data/FightAction";

// Interface that all class behavior scripts must implement
import {AiPlayerFighter} from "./fighter/AiPlayerFighter";

export interface ClassBehavior {
	chooseAction(fighter: AiPlayerFighter, fightView: FightView): FightAction;
}

// Map to store class behaviors by class ID
const classBehaviors = new Map<number, ClassBehavior>();

/**
 * Register a class behavior
 * @param classId The class ID
 * @param behavior The behavior implementation
 */
export function registerClassBehavior(classId: number, behavior: ClassBehavior): void {
	classBehaviors.set(classId, behavior);
}

/**
 * Get a class behavior by class ID
 * @param classId The class ID
 * @returns The class behavior or undefined if not found
 */
export function getAiClassBehavior(classId: number): ClassBehavior | undefined {
	return classBehaviors.get(classId);
}