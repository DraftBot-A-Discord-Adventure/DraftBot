import {
	DataTypes, QueryInterface
} from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.addColumn("players", "attackGloryPoints", DataTypes.INTEGER);
	await context.addColumn("players", "defenseGloryPoints", DataTypes.INTEGER);

	// 50% of the glory points will go to the attack and 50% to the defense
	await context.sequelize.query(`
		UPDATE players
		SET attackGloryPoints  = gloryPoints * 0.5,
		    defenseGloryPoints = gloryPoints * 0.5`);
	await context.removeColumn("players", "gloryPoints");
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.addColumn("players", "gloryPoints", DataTypes.INTEGER);
	await context.sequelize.query(`
		UPDATE players
		SET gloryPoints = attackGloryPoints + defenseGloryPoints`);
	await context.removeColumn("players", "attackGloryPoints");
	await context.removeColumn("players", "defenseGloryPoints");
}
