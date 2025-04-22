import { QueryInterface } from "sequelize";
import {
	addCampaignMissionList, removeCampaignMissionList
} from "../GameDatabaseUtils";
import { MigrationNameChanger } from "../../../../../../Lib/src/database/MigrationNameChanger";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	if (await MigrationNameChanger.changeMigrationName(context, "018-newCampaignMission.js")) {
		return;
	}

	await addCampaignMissionList(context, [
		26,
		33,
		36,
		38,
		46,
		52,
		55,
		61,
		61,
		61,
		61,
		61,
		61,
		61,
		61,
		61
	]);
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await removeCampaignMissionList(context, [
		26,
		33,
		36,
		38,
		46,
		52,
		55,
		61,
		61,
		61,
		61,
		61,
		61,
		61,
		61,
		61
	]);
}
