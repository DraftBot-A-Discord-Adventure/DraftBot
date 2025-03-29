/**
 * Game result
 */
export enum EloGameResult {
	LOSE = 0,
	DRAW = 0.5,
	WIN = 1
}

/**
 * Player information that will be used to display the impact of the fight on the player's elo
 */
export interface EndOfFightPlayerStatus {
	keycloakId: string,
	previousRating: number,
	newRating: number,
	kFactor: number,
	gameResult: EloGameResult
}