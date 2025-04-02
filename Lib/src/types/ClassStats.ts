import { ClassKind } from "./ClassKind";

export interface ClassStats {
	attack: number;
	defense: number;
	speed: number;
	health: number;
	classGroup: number;
	fightPoint: number;
	baseBreath: number;
	maxBreath: number;
	breathRegen: number;
	classKind: ClassKind;
}
