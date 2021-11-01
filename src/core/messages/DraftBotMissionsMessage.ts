import {DraftBotEmbed} from "./DraftBotEmbed";
import Player from "../models/Player";
import DailyMission from "../models/DailyMission";
import {TranslationModule, Translations} from "../Translations";
import {finishInTimeDisplay} from "../utils/TimeUtils";

export class DraftBotMissionsMessage extends DraftBotEmbed {
	constructor(player: Player, dailyMission: DailyMission, pseudo: string, language: string) {
		super();
		const tr = Translations.getModule("commands.missions", language);
		this.setTitle(tr.format("title", {
			pseudo
		}));
		let desc;
		if (!player.MissionsInfo.isCampaignCompleted()) {
			desc = tr.format("campaign", {
				current: player.MissionsInfo.campaignProgression,
				max: 0
			});
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
				dailyMission.Mission.formatDescription(dailyMission.objective, language),
				tomorrow,
				player.MissionsInfo.dailyMissionNumberDone,
				dailyMission.objective
			)
			+ "\n\n";

		const currentMissions = player.MissionSlots.filter(slot => slot.expiresAt !== null);
		if (currentMissions) {
			desc += tr.get("currentMissions") + "\n";
			for (const missionSlot of player.MissionSlots.filter(slot => !slot.isCampaign())) {
				desc += DraftBotMissionsMessage.getMissionDisplay(
					tr,
					missionSlot.Mission.formatDescription(missionSlot.missionObjective, language),
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
			timeBeforeExpiration: finishInTimeDisplay(expirationDate),
			progressionDisplay: DraftBotMissionsMessage.generateDisplayProgression(current, objective),
			current,
			objective
		});
	}

	private static generateDisplayProgression(current: number, objective: number): string {
		const progression = current / objective;
		const squareToDisplay = Math.floor(progression * 10);
		return "[" + "■".repeat(squareToDisplay) + "□".repeat(10 - squareToDisplay) + "]";
	}
}