import { Fighter } from "../fights/fighter/Fighter";

/**
 * Use for petAssist effects to determine if the pet effect should be skipped.
 * this is used for pet that put their effect at the start of the fight
 * @param turn - the current turn of the fight
 * @param opponent - the opponent fighter
 */
export function shouldSkipPetEffect(turn: number, opponent: Fighter): boolean {
	return turn > 3 || turn === 1 || opponent.hasFightAlteration();
}

