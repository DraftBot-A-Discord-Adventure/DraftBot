import {QueryInterface} from "sequelize";

/**
 * Add a mission to the campaign
 */
export async function addCampaignMission(context: QueryInterface, position: number): Promise<void> {
	await context.sequelize.query(`UPDATE draftbot_game.player_missions_info SET campaignProgression = campaignProgression + 1 WHERE campaignProgression > ${position}`);
	await context.sequelize.query(`UPDATE draftbot_game.player_missions_info SET campaignBlob = CONCAT(SUBSTR(campaignBlob, 0, ${position - 1}), "0", SUBSTR(campaignBlob, ${position}))`);
}