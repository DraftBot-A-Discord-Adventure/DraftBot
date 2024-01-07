import {QueryInterface} from "sequelize";
import {addCampaignMissionList, removeCampaignMissionList} from "../GameDatabaseUtils";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await addCampaignMissionList(context, [26, 33, 36, 38, 46, 52, 55, 61, 61, 61, 61, 61, 61, 61, 61, 61]);
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await removeCampaignMissionList(context, [26, 33, 36, 38, 46, 52, 55, 61, 61, 61, 61, 61, 61, 61, 61, 61]);
}