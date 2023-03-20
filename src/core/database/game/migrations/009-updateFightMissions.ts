import {QueryInterface} from "sequelize";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	// Update campaign
	await context.sequelize.query(`
		UPDATE mission_slots
		SET missionId = 'reachGlory',
		    missionObjective = 100,
		    gemsToWin = 1,
		    xpToWin = 50
		WHERE missionId = 'rankedFight'
		   AND expiresAt IS NULL
           AND missionObjective = 5
	`);
	await context.sequelize.query(`
		UPDATE mission_slots
		SET missionId = 'anyFight',
		    missionObjective = 5
		WHERE missionId = 'rankedFight'
		   AND expiresAt IS NULL
           AND missionObjective = 10
	`);
	await context.sequelize.query(`
		UPDATE mission_slots
		SET missionId = 'reachGlory',
			missionObjective = 800,
			xpToWin = 150
		WHERE missionId = 'rankedFight'
		  AND expiresAt IS NULL
		  AND missionObjective = 15
	`);

	// Update secondary missions
	await context.sequelize.query(`
		UPDATE mission_slots
		SET missionId = 'anyFight'
		WHERE missionId = 'rankedFight'
		   OR missionId = 'friendlyFight'
	`);
}

export async function down(): Promise<void> {
	/* No down to do */
}