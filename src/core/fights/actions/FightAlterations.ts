import {FightAlteration} from "@Core/src/core/fights/actions/FightAlteration";

export const FightAlterations = {
	CONCENTRATED: new FightAlteration("concentrated"),
	POISONED: new FightAlteration("poisoned"),
	PROTECTED: new FightAlteration("protected"),
	SLOWED: new FightAlteration("slowed"),
	STUNNED: new FightAlteration("stunned"),
	WEAK: new FightAlteration("weak"),
	PARALYZED: new FightAlteration("paralyzed"),
	TARGETED: new FightAlteration("targeted"),
	BURNED: new FightAlteration("burned"),
	CURSED: new FightAlteration("cursed"),
	OUTRAGE: new FightAlteration("outrage"),
	PETRIFIED: new FightAlteration("petrified"),
	FULL: new FightAlteration("full"),
	FROZEN: new FightAlteration("frozen")
};