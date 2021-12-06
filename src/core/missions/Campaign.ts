import {Data, DataModule} from "../Data";
import Player from "../models/Player";
import MissionSlot, {MissionSlots} from "../models/MissionSlot";
import {MissionsController} from "./MissionsController";
import {TextChannel} from "discord.js";

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

	static async updatePlayerCampaign(player: Player, channel: TextChannel, language: string): Promise<void> {
		const [campaign] = player.MissionSlots.filter(m => m.isCampaign());
		if (!campaign) {
			const campaignJson = require("../../../../resources/text/campaign.json").missions[0];
			campaignJson.playerId = player.id;
			const slot = await MissionSlot.create(campaignJson);
			player.MissionSlots.push(await MissionSlots.getById(slot.id));
			return;
		}
		if (!campaign || !this.hasNextCampaign(player.PlayerMissionsInfo.campaignProgression) && campaign.isCompleted()) {
			return;
		}
		if (!campaign.isCompleted()) {
			return;
		}
		const prop = Campaign.getDataModule().getObjectFromArray("missions", player.PlayerMissionsInfo.campaignProgression);
		campaign.missionVariant = prop.missionVariant;
		campaign.gemsToWin = prop.gemsToWin;
		campaign.xpToWin = prop.xpToWin;
		campaign.numberDone = await MissionsController.getMissionInterface(prop.missionId).initialNumberDone(player, prop.missionVariant);
		campaign.missionId = prop.missionId;
		campaign.missionObjective = prop.missionObjective;
		player.PlayerMissionsInfo.campaignProgression++;
		await campaign.save();
		await player.PlayerMissionsInfo.save();
		if (campaign.numberDone >= campaign.missionObjective) {
			await MissionsController.completeMissionSlots(player, channel, language, [await MissionSlots.getById(campaign.id)]);
		}
	}
}