import ConcentratedAlteration from "./interfaces/alterations/concentrated";
import ConfusedAlteration from "./interfaces/alterations/confused";
import PoisonedAlteration from "./interfaces/alterations/poisoned";
import ProtectedAlteration from "./interfaces/alterations/protected";
import SlowedAlteration from "./interfaces/alterations/slowed";
import StunnedAlteration from "./interfaces/alterations/stunned";
import WeakAlteration from "./interfaces/alterations/weak";

export const FightAlterations = {
	CONCENTRATED: new ConcentratedAlteration("concentrated"),
	CONFUSED: new ConfusedAlteration("confused"),
	POISONED: new PoisonedAlteration("poisoned"),
	PROTECTED: new ProtectedAlteration("protected"),
	SLOWED: new SlowedAlteration("slowed"),
	STUNNED: new StunnedAlteration("stunned"),
	WEAK: new WeakAlteration("weak")
};