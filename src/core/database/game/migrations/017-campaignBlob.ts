import {DataTypes, QueryInterface} from "sequelize";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await context.addColumn("player_missions_info", "campaignBlob", {
		type: DataTypes.STRING
	});
	// Get how many campaign missions there are
	const campaignMissions = require("../../../../../../resources/text/campaign.json").missions.length;
	console.log(`There are ${campaignMissions} campaign missions`);
	// Set the campaignBlob to a list of 1 of size campaignProgression for each player. The rest is a list of 0 of how many campaign missions there are
	await context.sequelize.query(`UPDATE player_missions_info SET campaignBlob = CONCAT(REPEAT("1", campaignProgression-1), REPEAT("0", ${campaignMissions}-campaignProgression+1))`);
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("player_missions_info", "campaignBlob");
}