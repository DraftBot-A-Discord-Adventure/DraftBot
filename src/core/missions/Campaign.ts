import {Data, DataModule} from "../Data";
import MissionSlot, {MissionSlots} from "../database/game/models/MissionSlot";
import {MissionsController} from "./MissionsController";
import {CompletedMission, CompletedMissionType} from "./CompletedMission";
import {Missions} from "../database/game/models/Mission";
import {draftBotInstance} from "../bot";
import Player from "../database/game/models/Player";
import PlayerMissionsInfo, {PlayerMissionsInfos} from "../database/game/models/PlayerMissionsInfo";

export class Campaign {
	private static maxCampaignCache = -1;

	private static campaignModule: DataModule = null;

	static getMaxCampaignNumber(): number {
		if (this.maxCampaignCache === -1) {
			this.maxCampaignCache = Campaign.getDataModule().getListSize("missions");
		}
		return this.maxCampaignCache;
	}

	static hasNextCampaign(campaignIndex: number): boolean {
		return campaignIndex < this.getMaxCampaignNumber();
	}

	public static async completeCampaignMissions(player: Player, missionInfo: PlayerMissionsInfo, completedCampaign: boolean, campaign: MissionSlot, language: string): Promise<CompletedMission[]> {
		const completedMissions: CompletedMission[] = [];
		let firstMissionChecked = false;
		while (campaign.isCompleted()) {
			if (completedCampaign || firstMissionChecked) {
				const missionModel = await Missions.getById(campaign.missionId);
				completedMissions.push(
					new CompletedMission(
						campaign.xpToWin,
						campaign.gemsToWin,
						campaign.moneyToWin,
						await missionModel.formatDescription(campaign.missionObjective, campaign.missionVariant, language, campaign.saveBlob),
						CompletedMissionType.CAMPAIGN)
				);
				draftBotInstance.logsDatabase.logMissionCampaignProgress(player.discordUserId, missionInfo.campaignProgression).then();
			}
			if (this.hasNextCampaign(missionInfo.campaignProgression)) {
				const prop = Campaign.getDataModule().getObjectFromArray("missions", missionInfo.campaignProgression);
				campaign.missionVariant = prop.missionVariant as number;
				campaign.gemsToWin = prop.gemsToWin as number;
				campaign.xpToWin = prop.xpToWin as number;
				campaign.numberDone = await MissionsController.getMissionInterface(prop.missionId as string).initialNumberDone(player, prop.missionVariant as number);
				campaign.missionId = prop.missionId as string;
				campaign.missionObjective = prop.missionObjective as number;
				campaign.moneyToWin = prop.moneyToWin as number;
				campaign.saveBlob = null;
				missionInfo.campaignProgression++;
			}
			else {
				break;
			}
			firstMissionChecked = true;
		}
		if (completedMissions.length !== 0 || !completedCampaign) {
			await campaign.save();
			await missionInfo.save();
		}
		return completedMissions;
	}

	public static async updatePlayerCampaign(completedCampaign: boolean, player: Player, language: string): Promise<CompletedMission[]> {
		const campaign = await MissionSlots.getCampaignOfPlayer(player.id);
		if (!campaign) {
			const campaignJson = require("../../../../resources/text/campaign.json").missions[0];
			campaignJson.playerId = player.id;
			return this.updatePlayerCampaign(completedCampaign, player, language);
		}
		const missionsInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
		if (completedCampaign || Campaign.hasNextCampaign(missionsInfo.campaignProgression)) {
			return await this.completeCampaignMissions(player, missionsInfo, completedCampaign, campaign, language);
		}
		return [];
	}

	private static getDataModule(): DataModule {
		if (!this.campaignModule) {
			this.campaignModule = Data.getModule("campaign");
		}
		return this.campaignModule;
	}
}