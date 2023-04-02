import Player from "../database/game/models/Player";
import {FightConstants} from "../constants/FightConstants";

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
		if (player.gloryPoints < FightConstants.ELO.LOW_K_FACTOR_THRESHOLD) {
			return FightConstants.ELO.DEFAULT_K_FACTOR;
		}

		if (player.gloryPoints < FightConstants.ELO.VERY_LOW_K_FACTOR_THRESHOLD) {
			return FightConstants.ELO.LOW_K_FACTOR;
		}

		return FightConstants.ELO.VERY_LOW_K_FACTOR;
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
		return newElo > playerRating ?
			// We add a bonus to the low elo players
			newElo + Math.round((newElo - playerRating) * (1.49 - Math.tanh((playerRating - 502) / 140) / 2 - 0.87)) :
			// no malus if you are the loser
			newElo < 0 ? 0 : newElo;
	}
}