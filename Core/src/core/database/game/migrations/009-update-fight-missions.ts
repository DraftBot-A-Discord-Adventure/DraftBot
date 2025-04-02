import { QueryInterface } from "sequelize";
import { MigrationNameChanger } from "../../../../../../Lib/src/database/MigrationNameChanger";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	if (await MigrationNameChanger.changeMigrationName(context, "009-updateFightMissions.js")) {
		return;
	}

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

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	// Down campaign
	await context.sequelize.query(`
		UPDATE mission_slots
		SET missionId = 'rankedFight',
			missionObjective = 5,
			gemsToWin = 4,
			xpToWin = 250
		WHERE missionId = 'reachGlory'
		   AND expiresAt IS NULL
           AND missionObjective = 100
	`);
	await context.sequelize.query(`
		UPDATE mission_slots
		SET missionId = 'rankedFight',
			missionObjective = 10
		WHERE missionId = 'anyFight'
		  AND expiresAt IS NULL
		  AND missionObjective = 5
		  AND gemsToWin = 2
		  AND xpToWin = 100
	`);
	await context.sequelize.query(`
		UPDATE mission_slots
		SET missionId = 'rankedFight',
			missionObjective = 15,
			xpToWin = 125
		WHERE missionId = 'reachGlory'
		   AND expiresAt IS NULL
           AND missionObjective = 800
	`);

	// However we can't down secondary missions
}
