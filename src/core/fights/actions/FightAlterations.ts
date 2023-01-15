import ConcentratedAlteration from "./interfaces/alterations/concentrated";
import PoisonedAlteration from "./interfaces/alterations/poisoned";
import ProtectedAlteration from "./interfaces/alterations/protected";
import SlowedAlteration from "./interfaces/alterations/slowed";
import StunnedAlteration from "./interfaces/alterations/stunned";
import WeakAlteration from "./interfaces/alterations/weak";
import ParalyzedAlteration from "./interfaces/alterations/paralyzed";
import TargetedAlteration from "./interfaces/alterations/targeted";
import BurnedAlteration from "./interfaces/alterations/burned";
import CursedAlteration from "./interfaces/alterations/cursed";

export const FightAlterations = {
	CONCENTRATED: new ConcentratedAlteration("concentrated"),
	POISONED: new PoisonedAlteration("poisoned"),
	PROTECTED: new ProtectedAlteration("protected"),
	SLOWED: new SlowedAlteration("slowed"),
	STUNNED: new StunnedAlteration("stunned"),
	WEAK: new WeakAlteration("weak"),
	PARALYZED: new ParalyzedAlteration("paralyzed"),
	TARGETED: new TargetedAlteration("targeted"),
	BURNED: new BurnedAlteration("burned"),
	CURSED: new CursedAlteration("cursed")
};