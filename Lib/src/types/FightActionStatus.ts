/**
 * FightActionStatus enum used to define the status of a fight action
 * Those are also the keys used in the translation files, so they should be kept in sync
 * Note, those should also not collide with FightAlterationState and PetAssistanceState
 */
export enum FightActionStatus {
	CRITICAL = "critical",
	MISSED = "missed",
	NORMAL = "normal",
	MAX_USES = "maxUses",
	CHARGING = "charging"
}
