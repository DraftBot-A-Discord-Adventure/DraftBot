import {DataTypes, QueryInterface} from "sequelize";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await context.addColumn("player_missions_info", "campaignBlob", {
		type: DataTypes.STRING
	});
	await context.sequelize.query("UPDATE player_missions_info SET campaignBlob = CONCAT(REPEAT(\"1\", campaignProgression-1), REPEAT(\"0\", 60-campaignProgression+1))");
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("player_missions_info", "campaignBlob");
}