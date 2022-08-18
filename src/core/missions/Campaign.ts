import {Data, DataModule} from "../Data";
import Player from "../database/game/models/Player";
import MissionSlot, {MissionSlots} from "../database/game/models/MissionSlot";
import {MissionsController} from "./MissionsController";
import {CompletedMission, CompletedMissionType} from "./CompletedMission";
import {Missions} from "../database/game/models/Mission";
import {draftBotInstance} from "../bot";
import Entity from "../database/game/models/Entity";

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

	public static async completeCampaignMissions(entity: Entity, completedCampaign: boolean, campaign: MissionSlot, language: string): Promise<CompletedMission[]> {
		const completedMissions: CompletedMission[] = [];
		let firstMissionChecked = false;
		while (campaign.isCompleted()) {
			if (completedCampaign || firstMissionChecked) {
				completedMissions.push(
					new CompletedMission(
						campaign.xpToWin,
						campaign.gemsToWin,
						campaign.moneyToWin,
						await campaign.Mission.formatDescription(campaign.missionObjective, campaign.missionVariant, language, campaign.saveBlob),
						CompletedMissionType.CAMPAIGN)
				);
				draftBotInstance.logsDatabase.logMissionCampaignProgress(entity.discordUserId, entity.Player.PlayerMissionsInfo.campaignProgression).then();
			}
			if (this.hasNextCampaign(entity.Player.PlayerMissionsInfo.campaignProgression)) {
				const prop = Campaign.getDataModule().getObjectFromArray("missions", entity.Player.PlayerMissionsInfo.campaignProgression);
				campaign.missionVariant = prop.missionVariant;
				campaign.gemsToWin = prop.gemsToWin;
				campaign.xpToWin = prop.xpToWin;
				campaign.numberDone = await MissionsController.getMissionInterface(prop.missionId).initialNumberDone(entity.Player, prop.missionVariant);
				campaign.missionId = prop.missionId;
				campaign.missionObjective = prop.missionObjective;
				campaign.moneyToWin = prop.moneyToWin;
				campaign.saveBlob = null;
				entity.Player.PlayerMissionsInfo.campaignProgression++;
				campaign.Mission = await Missions.getById(campaign.missionId);
			}
			else {
				break;
			}
			firstMissionChecked = true;
		}
		if (completedMissions.length !== 0 || !completedCampaign) {
			await campaign.save();
			await entity.Player.PlayerMissionsInfo.save();
		}
		return completedMissions;
	}

	public static async updatePlayerCampaign(completedCampaign: boolean, entity: Entity, language: string): Promise<CompletedMission[]> {
		const [campaign] = entity.Player.MissionSlots.filter(m => m.isCampaign());
		if (!campaign) {
			const campaignJson = require("../../../../resources/text/campaign.json").missions[0];
			campaignJson.playerId = entity.Player.id;
			const slot = await MissionSlot.create(campaignJson);
			entity.Player.MissionSlots.push(await MissionSlots.getById(slot.id));
			return this.updatePlayerCampaign(completedCampaign, entity, language);
		}
		if (completedCampaign || Campaign.hasNextCampaign(entity.Player.PlayerMissionsInfo.campaignProgression)) {
			return await this.completeCampaignMissions(entity, completedCampaign, campaign, language);
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