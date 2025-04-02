import { QueryInterface } from "sequelize";

/**
 * Add a mission to the campaign
 */
export async function addCampaignMission(context: QueryInterface, position: number): Promise<void> {
	await context.sequelize.query(`UPDATE player_missions_info SET campaignProgression = campaignProgression + 1 WHERE campaignProgression >= ${position}`);
	await context.sequelize.query(`UPDATE player_missions_info SET campaignBlob = CONCAT(SUBSTR(campaignBlob, 1, ${position - 1}), "0", SUBSTR(campaignBlob, ${position}))`);
}

/**
 * Add a list of missions to the campaign
 */
export async function addCampaignMissionList(context: QueryInterface, positions: number[]): Promise<void> {
	positions.sort((a, b) => b - a);
	for (const position of positions) {
		await addCampaignMission(context, position);
	}
}

/**
 * Remove a mission from the campaign
 */
export async function removeCampaignMission(context: QueryInterface, position: number): Promise<void> {
	await context.sequelize.query(`UPDATE player_missions_info SET campaignProgression = campaignProgression - 1 WHERE campaignProgression >= ${position}`);
	await context.sequelize.query(`UPDATE player_missions_info SET campaignBlob = CONCAT(SUBSTR(campaignBlob, 1, ${position - 1}), SUBSTR(campaignBlob, ${position + 1}))`);
}

/**
 * Remove a list of missions from the campaign
 */
export async function removeCampaignMissionList(context: QueryInterface, positions: number[]): Promise<void> {
	positions.sort((a, b) => b - a);
	for (const position of positions) {
		await removeCampaignMission(context, position);
	}
}
