import {DraftBotEmbed} from "./DraftBotEmbed";
import {DailyMissions} from "../database/game/models/DailyMission";
import {TranslationModule, Translations} from "../Translations";
import {finishInTimeDisplay, getTomorrowMidnight} from "../utils/TimeUtils";
import {Campaign} from "../missions/Campaign";
import {User} from "discord.js";
import {draftBotClient} from "../bot";
import {MissionSlots} from "../database/game/models/MissionSlot";
import Player from "../database/game/models/Player";
import {PlayerMissionsInfos} from "../database/game/models/PlayerMissionsInfo";
import {Missions} from "../database/game/models/Mission";

export class DraftBotMissionsMessageBuilder {
	private _player: Player;

	private readonly _user: User;

	private readonly _language: string;

	constructor(player: Player, user: User, language: string) {
		this._player = player;
		this._user = user;
		this._language = language;
	}

	/**
	 * Get the display of the mission
	 * @param tr
	 * @param description
	 * @param expirationDate
	 * @param current
	 * @param objective
	 */
	static getMissionDisplay(tr: TranslationModule, description: string, expirationDate: Date, current: number, objective: number): string {
		return tr.format("missionDisplay", {
			description,
			campaign: expirationDate === null,
			timeBeforeExpiration: expirationDate ? finishInTimeDisplay(expirationDate) : null,
			progressionDisplay: DraftBotMissionsMessageBuilder.generateDisplayProgression(current, objective),
			current,
			objective
		});
	}

	/**
	 * Get the progression bar corresponding to the progression of the mission
	 * @param current
	 * @param objective
	 * @private
	 */
	private static generateDisplayProgression(current: number, objective: number): string {
		let progression = current / objective;
		if (progression < 0) {
			return "ERROR:PROGRESS_BAR_NEGATIVE";
		}
		if (progression > 1) {
			progression = 1;
		}
		const squareToDisplay = Math.floor(progression * 10);
		return `[${"■".repeat(squareToDisplay)}${"□".repeat(10 - squareToDisplay)}]`;
	}

	public async build(): Promise<DraftBotEmbed> {
		const tr = Translations.getModule("commands.missions", this._language);
		let desc;
		const dailyMission = await DailyMissions.getOrGenerate();
		const missionSlots = await MissionSlots.getOfPlayer(this._player.id);
		const [campaign] = missionSlots.filter(m => m.isCampaign());
		const missionsInfo = await PlayerMissionsInfos.getOfPlayer(this._player.id);
		if (!campaign.isCompleted()) {
			desc = `${tr.format("campaign", {
				current: missionsInfo.campaignProgression,
				max: Campaign.getMaxCampaignNumber()
			})}\n${DraftBotMissionsMessageBuilder.getMissionDisplay(
				tr,
				await (await Missions.getById(campaign.missionId)).formatDescription(campaign.missionObjective, campaign.missionVariant, this._language, campaign.saveBlob),
				null,
				campaign.numberDone,
				campaign.missionObjective
			)}`;
		}
		else {
			desc = `\n${tr.get("finishedCampaign")}`;
		}
		const tomorrow = getTomorrowMidnight();
		desc += `\n\n${tr.get("daily")}\n`;
		if (missionsInfo.hasCompletedDailyMission()) {
			desc += tr.format("dailyFinished", {time: finishInTimeDisplay(tomorrow)});
		}
		else {
			desc += DraftBotMissionsMessageBuilder.getMissionDisplay(
				tr,
				await dailyMission.Mission.formatDescription(dailyMission.objective, dailyMission.variant, this._language, null),
				tomorrow,
				missionsInfo.dailyMissionNumberDone,
				dailyMission.objective
			);
		}

		const currentMissions = missionSlots.filter(slot => !slot.isCampaign());

		desc += `\n\n${tr.format("currentMissions", {
			slots: this._player.getMissionSlots(),
			amountOfMissions: currentMissions.length
		})}\n`;
		if (currentMissions.length === 0) {
			desc += tr.get("noCurrentMissionsDescription");
		}
		else {
			for (const missionSlot of missionSlots.filter(slot => !slot.isCampaign())) {
				desc += `${DraftBotMissionsMessageBuilder.getMissionDisplay(
					tr,
					await (await Missions.getById(missionSlot.missionId)).formatDescription(missionSlot.missionObjective, missionSlot.missionVariant, this._language, missionSlot.saveBlob),
					missionSlot.expiresAt,
					missionSlot.numberDone,
					missionSlot.missionObjective
				)}\n\n`;
			}
		}
		const msg = new DraftBotEmbed();
		msg.formatAuthor(tr.get("title"), this._user, await draftBotClient.users.fetch(this._player.discordUserId));
		msg.setDescription(desc);
		return msg;
	}
}