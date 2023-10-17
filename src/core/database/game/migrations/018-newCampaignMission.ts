import {QueryInterface} from "sequelize";
import {addCampaignMissionList, removeCampaignMissionList} from "../GameDatabaseUtils";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await addCampaignMissionList(context, [16]);
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await removeCampaignMissionList(context, [16]);
}