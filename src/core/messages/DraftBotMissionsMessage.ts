import {DraftBotEmbed} from "./DraftBotEmbed";
import Player from "../models/Player";
import DailyMission from "../models/DailyMission";
import {TranslationModule, Translations} from "../Translations";
import {finishInTimeDisplay} from "../utils/TimeUtils";
import {Campaign} from "../missions/Campaign";

export class DraftBotMissionsMessage extends DraftBotEmbed {
	constructor(player: Player, dailyMission: DailyMission, pseudo: string, language: string) {
		super();
		const tr = Translations.getModule("commands.missions", language);
		this.setTitle(tr.format("title", {
			pseudo
		}));
		let desc;
		const [campaign] = player.MissionSlots.filter(m => m.isCampaign());
		if (!campaign.isCompleted()) {
			desc = tr.format("campaign", {
				current: player.PlayerMissionsInfo.campaignProgression,
				max: Campaign.getMaxCampaignNumber()
			}) + "\n" + DraftBotMissionsMessage.getMissionDisplay(
				tr,
				campaign.Mission.formatDescription(campaign.missionObjective, campaign.missionVariant, language),
				null,
				campaign.numberDone,
				campaign.missionObjective
			);
		}
		else {
			desc = "\n" + tr.get("finishedCampaign");
		}
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);
		desc += "\n\n" + tr.get("daily")
			+ "\n"
			+ DraftBotMissionsMessage.getMissionDisplay(
				tr,
				dailyMission.Mission.formatDescription(dailyMission.objective, dailyMission.variant, language),
				tomorrow,
				player.PlayerMissionsInfo.dailyMissionNumberDone,
				dailyMission.objective
			)
			+ "\n\n";

		const currentMissions = player.MissionSlots.filter(slot => slot.expiresAt !== null);
		if (currentMissions) {
			desc += tr.get("currentMissions") + "\n";
			for (const missionSlot of player.MissionSlots.filter(slot => !slot.isCampaign())) {
				desc += DraftBotMissionsMessage.getMissionDisplay(
					tr,
					missionSlot.Mission.formatDescription(missionSlot.missionObjective, missionSlot.missionVariant, language),
					missionSlot.expiresAt,
					missionSlot.numberDone,
					missionSlot.missionObjective
				) + "\n\n";
			}
		}
		this.setDescription(desc);
	}

	private static getMissionDisplay(tr: TranslationModule, description: string, expirationDate: Date, current: number, objective: number): string {
		return tr.format("missionDisplay", {
			description,
			campaign: expirationDate === null,
			timeBeforeExpiration: expirationDate ? finishInTimeDisplay(expirationDate) : null,
			progressionDisplay: DraftBotMissionsMessage.generateDisplayProgression(current, objective),
			current,
			objective
		});
	}

	private static generateDisplayProgression(current: number, objective: number): string {
		let progression = current / objective;
		if (progression > 1) {
			progression = 1;
		}
		const squareToDisplay = Math.floor(progression * 10);
		return "[" + "■".repeat(squareToDisplay) + "□".repeat(10 - squareToDisplay) + "]";
	}
}