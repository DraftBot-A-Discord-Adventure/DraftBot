import Player from "../database/game/models/Player";

export function verifyPossibilityCondition(condition: PossibilityCondition, player: Player): Promise<boolean> {
	return Promise.resolve(player.level >= (condition.level ?? 0));
}

export interface PossibilityCondition {
	level?: number;
}