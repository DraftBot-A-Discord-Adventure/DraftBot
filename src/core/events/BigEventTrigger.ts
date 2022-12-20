import Player from "../database/game/models/Player";

/**
 * Verify whether a big event trigger is verified
 * @param mapId The map id
 * @param player The player
 * @param trigger The big event trigger object
 */
export function verifyTrigger(mapId: number, player: Player, trigger: BigEventTrigger): boolean {
	return (trigger.mapId ? mapId === trigger.mapId : true) &&
		(trigger.level ? player.level > trigger.level : true);
}

/**
 * A big event trigger is a set of condition to trigger a big event (for instance a map id, a minimum level etc...)
 */
export interface BigEventTrigger {
	mapId?: number;
	level?: number;
}