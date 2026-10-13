export const ACCOUNT_COLLISION_CHOICES = {
	DISCORD: "discord",
	EMAIL: "email"
} as const;

export const ACCOUNT_COLLISION_ENDPOINTS = {
	CHECK: "/account/collision",
	VERIFY: "/account/collision/verify",
	RESOLVE: "/account/collision/resolve"
} as const;

export type AccountCollisionChoice = typeof ACCOUNT_COLLISION_CHOICES[keyof typeof ACCOUNT_COLLISION_CHOICES];

export const ACCOUNT_COLLISION_ERRORS = {
	UNAUTHORIZED: "unauthorized",
	UNVERIFIED_EMAIL: "unverifiedEmail",
	ACCOUNT_CHANGED: "accountChanged",
	PROOF_EXPIRED: "proofExpired",
	CONFLICT: "conflict",
	UNAVAILABLE: "unavailable"
} as const;

export type AccountCollisionError = typeof ACCOUNT_COLLISION_ERRORS[keyof typeof ACCOUNT_COLLISION_ERRORS];

export type CollisionAccountAdventure = {
	level: number; score: number; classId: number;
};

export type CollisionAccount = {
	name: string;

	/** Milliseconds since the epoch. */
	createdAt: number;

	/** Absent when the account never started an adventure, or when the game could not tell in time. */
	adventure?: CollisionAccountAdventure;
};

export type AccountCollision = {
	email: string;
	discord: CollisionAccount;
	emailAccount: CollisionAccount;
};

export type AccountCollisionCheck = {
	collision: AccountCollision | null; pending?: AccountCollisionChoice; current?: AccountCollisionChoice;
};
export type AccountCollisionProof = {
	proof: string; collision: AccountCollision;
};
export type AccountCollisionResolution = { kept: AccountCollisionChoice };
