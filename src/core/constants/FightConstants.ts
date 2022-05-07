export abstract class FightConstants {
	static readonly MAX_SPEED_IMPROVEMENT = 30;

	static readonly MAX_TURNS = 25;

	static readonly REQUIRED_LEVEL = 8;

	static readonly POINTS_REGEN_MINUTES = 15;

	static readonly POINTS_REGEN_AMOUNT = 50;

	static readonly FIGHT_ERROR = {
		NONE: "none",
		WRONG_LEVEL: "error.noFightPoints",
		DISALLOWED_EFFECT: "error.cantFightStatus",
		OCCUPIED: "error.occupied",
		NO_FIGHT_POINTS: "error.levelTooLow"
	};
}