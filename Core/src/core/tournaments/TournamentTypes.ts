import type { TournamentCategory } from "../../../../Lib/src/types/Tournament";

export const TournamentCommandAccesses = {
	// The command cannot be used in a tournament channel
	NONE: "none",

	// The command starts a tournament fight in a tournament channel
	FIGHT: "fight",

	// The command is always allowed, in a tournament channel it shows the tournament state
	STATUS: "status",

	// The command is always allowed and skips the tournament checks
	BYPASS: "bypass"
} as const;

export type TournamentCommandAccess = typeof TournamentCommandAccesses[keyof typeof TournamentCommandAccesses];

export const TournamentAccessResults = {
	DENIED: "denied",
	ALLOWED: "allowed",

	// Tournament fights happen outside of the world: location and effect requirements no longer apply
	TOURNAMENT_FIGHT: "tournamentFight"
} as const;

export type TournamentAccessResult = typeof TournamentAccessResults[keyof typeof TournamentAccessResults];

export type TournamentFightContext = {
	tournamentId: number;
	attackerParticipantId: number;
	defenderParticipantId: number;
	category: TournamentCategory;
};

export type TournamentRewardRank = {
	rank: number;
	categoryParticipantCount: number;
};

export type TournamentRewardAmounts = {
	experience: number;
	money: number;
	itemCount: number;
};
