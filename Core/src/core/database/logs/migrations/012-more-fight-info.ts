import {
	DataTypes, QueryInterface
} from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.addColumn("fights_results", "fightInitiatorInitialDefenseGlory", {
		type: DataTypes.INTEGER,
		allowNull: true
	});
	await context.addColumn("fights_results", "fightInitiatorInitialAttackGlory", {
		type: DataTypes.INTEGER,
		allowNull: true
	});
	await context.addColumn("fights_results", "fightInitiatorClassId", {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: true
	});
	await context.addColumn("fights_results", "player2InitialDefenseGlory", {
		type: DataTypes.INTEGER,
		allowNull: true
	});
	await context.addColumn("fights_results", "player2InitialAttackGlory", {
		type: DataTypes.INTEGER,
		allowNull: true
	});
	await context.addColumn("fights_results", "player2ClassId", {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: true
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("fights_results", "fightInitiatorInitialDefenseGlory");
	await context.removeColumn("fights_results", "fightInitiatorInitialAttackGlory");
	await context.removeColumn("fights_results", "fightInitiatorClassId");
	await context.removeColumn("fights_results", "player2InitialDefenseGlory");
	await context.removeColumn("fights_results", "player2InitialAttackGlory");
	await context.removeColumn("fights_results", "player2ClassId");
}
