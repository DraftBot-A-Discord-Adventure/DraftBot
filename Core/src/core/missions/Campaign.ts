import MissionSlot, {MissionSlots} from "../database/game/models/MissionSlot";
import {MissionsController} from "./MissionsController";
import Player from "../database/game/models/Player";
import PlayerMissionsInfo, {PlayerMissionsInfos} from "../database/game/models/PlayerMissionsInfo";
import {MissionDataController} from "../../data/Mission";
import {draftBotInstance} from "../../index";
import {CampaignData} from "../../data/Campaign";
import {CompletedMission, CompletedMissionType} from "../../../../Lib/src/interfaces/CompletedMission";

export class Campaign {
	private static maxCampaignCache = -1;

	static getMaxCampaignNumber(): number {
		if (this.maxCampaignCache === -1) {
			this.maxCampaignCache = CampaignData.getMissions().length;
		}
		return this.maxCampaignCache;
	}

	static hasNextCampaign(campaignIndex: number): boolean {
		return campaignIndex < this.getMaxCampaignNumber();
	}

	public static async completeCampaignMissions(player: Player, missionInfo: PlayerMissionsInfo, completedCampaign: boolean, campaign: MissionSlot): Promise<CompletedMission[]> {
		const completedMissions: CompletedMission[] = [];
		let firstMissionChecked = false;
		while (campaign.isCompleted()) {
			if (completedCampaign || firstMissionChecked) {
				completedMissions.push({
					completedMissionType: CompletedMissionType.CAMPAIGN,
					gems: campaign.gemsToWin,
					missionId: campaign.missionId,
					money: campaign.moneyToWin,
					numberDone: campaign.numberDone,
					objective: campaign.missionObjective,
					points: 0, // Campaign doesn't give points
					variant: campaign.missionVariant,
					xp: campaign.xpToWin
				});
				draftBotInstance.logsDatabase.logMissionCampaignProgress(player.keycloakId, missionInfo.campaignProgression)
					.then();
			}
			if (this.hasNextCampaign(missionInfo.campaignProgression)) {
				const prop = CampaignData.getMissions()[missionInfo.campaignProgression];
				campaign.missionVariant = prop.missionVariant as number;
				campaign.gemsToWin = prop.gemsToWin as number;
				campaign.xpToWin = prop.xpToWin as number;
				campaign.numberDone = await MissionsController.getMissionInterface(prop.missionId as string)
					.initialNumberDone(player, prop.missionVariant as number);
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

	public static async updatePlayerCampaign(completedCampaign: boolean, player: Player): Promise<CompletedMission[]> {
		const campaign = await MissionSlots.getCampaignOfPlayer(player.id);
		if (!campaign) {
			const campaignJson = CampaignData.getMissions()[0];
			return this.updatePlayerCampaign(completedCampaign, player);
		}
		const missionsInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
		if (completedCampaign || Campaign.hasNextCampaign(missionsInfo.campaignProgression)) {
			return await this.completeCampaignMissions(player, missionsInfo, completedCampaign, campaign);
		}
		return [];
	}

	/**
	 * Get the default campaign blob
	 */
	static getDefaultCampaignBlob(): string {
		return "0".repeat(this.getMaxCampaignNumber());
	}

	/**
	 * Get the amount of missions completed in the given campaign blob
	 * @param campaignBlob
	 */
	static getAmountOfCampaignCompleted(campaignBlob: string): number {
		return campaignBlob.split("1").length - 1;
	}
}