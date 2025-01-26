import {DataTypes, QueryInterface} from "sequelize";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await context.addColumn("players", "attackGloryPoints", DataTypes.INTEGER);
	await context.addColumn("players", "defenseGloryPoints", DataTypes.INTEGER);
	// 5% of the glory points will go to the attack and 5% to the defense
	await context.sequelize.query(`
		UPDATE players
		SET attackGloryPoints  = gloryPoints * 0.05,
		    defenseGloryPoints = gloryPoints * 0.05`);
	await context.removeColumn("players", "gloryPoints");

}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.addColumn("players", "gloryPoints", DataTypes.DATE);
	await context.sequelize.query(`
		UPDATE players
		SET gloryPoints = attackGloryPoints + defenseGloryPoints`);
	await context.removeColumn("players", "attackGloryPoints");
	await context.removeColumn("players", "defenseGloryPoints");
}