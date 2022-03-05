import {Data, DataModule} from "../Data";
import Player from "../models/Player";
import MissionSlot, {MissionSlots} from "../models/MissionSlot";
import {MissionsController} from "./MissionsController";
import {TextChannel} from "discord.js";
import {CompletedMission, CompletedMissionType} from "./CompletedMission";
import {Missions} from "../models/Mission";
import Entity from "../models/Entity";

export class Campaign {
	private static maxCampaignCache = -1;

	private static campaignModule: DataModule = null;

	private static getDataModule(): DataModule {
		if (!this.campaignModule) {
			this.campaignModule = Data.getModule("campaign");
		}
		return this.campaignModule;
	}

	static getMaxCampaignNumber(): number {
		if (this.maxCampaignCache === -1) {
			this.maxCampaignCache = Campaign.getDataModule().getListSize("missions");
		}
		return this.maxCampaignCache;
	}

	static hasNextCampaign(campaignIndex: number): boolean {
		return campaignIndex < this.getMaxCampaignNumber();
	}

	public static async completeCampaignMissions(player: Player, completedCampaign: boolean, campaign: MissionSlot, language: string): Promise<CompletedMission[]> {
		const completedMissions: CompletedMission[] = [];
		while (campaign.isCompleted()) {
			if (completedCampaign) {
				completedMissions.push(
					new CompletedMission(
						campaign.xpToWin,
						campaign.gemsToWin,
						campaign.moneyToWin,
						await campaign.Mission.formatDescription(campaign.missionObjective, campaign.missionVariant, language),
						CompletedMissionType.CAMPAIGN)
				);
			}
			if (this.hasNextCampaign(player.PlayerMissionsInfo.campaignProgression)) {
				const prop = Campaign.getDataModule().getObjectFromArray("missions", player.PlayerMissionsInfo.campaignProgression);
				campaign.missionVariant = prop.missionVariant;
				campaign.gemsToWin = prop.gemsToWin;
				campaign.xpToWin = prop.xpToWin;
				campaign.numberDone = await MissionsController.getMissionInterface(prop.missionId).initialNumberDone(player, prop.missionVariant);
				campaign.missionId = prop.missionId;
				campaign.missionObjective = prop.missionObjective;
				campaign.moneyToWin = prop.moneyToWin;
				campaign.saveBlob = null;
				player.PlayerMissionsInfo.campaignProgression++;
				campaign.Mission = await Missions.getById(campaign.missionId);
			}
			else {
				break;
			}
		}
		if (completedMissions.length !== 0 || !completedCampaign) {
			await campaign.save();
			await player.PlayerMissionsInfo.save();
		}
		return completedMissions;
	}

	public static async updatePlayerCampaign(completedCampaign: boolean, player: Player, language: string): Promise<CompletedMission[]> {
		const [campaign] = player.MissionSlots.filter(m => m.isCampaign());
		if (!campaign) {
			const campaignJson = require("../../../../resources/text/campaign.json").missions[0];
			campaignJson.playerId = player.id;
			const slot = await MissionSlot.create(campaignJson);
			player.MissionSlots.push(await MissionSlots.getById(slot.id));
			return this.updatePlayerCampaign(completedCampaign, player, language);
		}
		if (completedCampaign || Campaign.hasNextCampaign(player.PlayerMissionsInfo.campaignProgression)) {
			return await this.completeCampaignMissions(player, completedCampaign, campaign, language);
		}
		return [];
	}

	public static async updateCampaignAndSendMessage(entity: Entity, channel: TextChannel, language: string) {
		const completedMissions = await MissionsController.completeAndUpdateMissions(entity.Player, false, false, language);
		if (completedMissions.length !== 0) {
			await MissionsController.updatePlayerStats(entity, completedMissions, channel, language);
			await MissionsController.sendCompletedMissions(entity.discordUserId, entity.Player, completedMissions, channel, language);
		}
	}
}