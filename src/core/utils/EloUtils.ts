import Player from "../database/game/models/Player";

/**
 * Game result
 */
export enum EloGameResult {
	LOSE = 0,
	DRAW = 0.5,
	WIN = 1
}

export abstract class EloUtils {
	/**
	 * Get the k-factor of a player
	 * @param player
	 */
	static getKFactor(player: Player): number {
		if (player.gloryPoints < 2100) {
			return 32;
		}

		if (player.gloryPoints < 2400) {
			return 24;
		}

		return 16;
	}

	/**
	 * Calculate the new elo rating of a player
	 * @param playerRating The player rating
	 * @param opponentRating Their opponent rating
	 * @param gameResult The game result for the player
	 * @param kFactor The k factor of the player (see EloUtils.getKFactor)
	 */
	static calculateNewRating(playerRating: number, opponentRating: number, gameResult: EloGameResult, kFactor: number): number {
		const newElo = Math.round(playerRating + kFactor * (gameResult - 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400))));
		return newElo < 0 ? 0 : newElo;
	}
}