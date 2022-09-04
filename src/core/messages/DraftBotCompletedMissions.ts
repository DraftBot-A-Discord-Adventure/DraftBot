import {DraftBotEmbed} from "./DraftBotEmbed";
import {User} from "discord.js";
import {TranslationModule, Translations} from "../Translations";
import {CompletedMission, CompletedMissionType} from "../missions/CompletedMission";
import {escapeUsername} from "../utils/StringUtils";

export class DraftBotCompletedMissions extends DraftBotEmbed {
	constructor(user: User, completedMissions: CompletedMission[], language: string) {
		super();
		const tr = Translations.getModule("models.missions", language);
		this.setAuthor({
			name: tr.format("completedTitle", {
				missionCount: completedMissions.length,
				pseudo: escapeUsername(user.username)
			}),
			iconURL: user.displayAvatarURL()
		});
		let sideMissions = "";
		let dailyMission = "";
		let campaignMissions = "";
		let totalGems = 0;
		let totalXP = 0;
		for (const completedMission of completedMissions) {
			totalGems += completedMission.gemsToWin;
			totalXP += completedMission.xpToWin;
			if (completedMission.completedMissionType === CompletedMissionType.NORMAL) {
				sideMissions += DraftBotCompletedMissions.getMissionDisplay(tr, completedMission);
			}
			else if (completedMission.completedMissionType === CompletedMissionType.CAMPAIGN) {
				campaignMissions += DraftBotCompletedMissions.getMissionDisplay(tr, completedMission);
			}
			else if (completedMission.completedMissionType === CompletedMissionType.DAILY) {
				dailyMission += DraftBotCompletedMissions.getMissionDisplay(tr, completedMission);
			}
		}
		if (campaignMissions.length !== 0) {
			this.addFields({
				name: tr.format("campaign", {
					missionCount: completedMissions.filter(mission => mission.completedMissionType === CompletedMissionType.CAMPAIGN).length
				}),
				value: campaignMissions
			});
		}
		if (dailyMission.length !== 0) {
			this.addFields({
				name: tr.format("daily", {
					missionCount: completedMissions.filter(mission => mission.completedMissionType === CompletedMissionType.DAILY).length
				}),
				value: dailyMission
			});
		}
		if (sideMissions.length !== 0) {
			this.addFields({
				name: tr.format("sideMissions", {
					missionCount: completedMissions.filter(mission => mission.completedMissionType === CompletedMissionType.NORMAL).length
				}),
				value: sideMissions
			});
		}
		if (completedMissions.length > 1) {
			this.addFields({
				name: tr.get("totalRewards"),
				value: tr.format("totalDisplay", {
					gems: totalGems,
					xp: totalXP
				})
			});
		}
	}

	private static getMissionDisplay(tr: TranslationModule, completedMission: CompletedMission): string {
		const missionDisplay = `• ${completedMission.desc}`;
		const rewardDisplays = [];
		if (completedMission.gemsToWin > 0) {
			rewardDisplays.push(tr.format("gemsDisplay", {
				gems: completedMission.gemsToWin
			}));
		}
		if (completedMission.moneyToWin > 0) {
			rewardDisplays.push(tr.format("moneyDisplay", {
				money: completedMission.moneyToWin
			}));
		}
		if (completedMission.xpToWin > 0) {
			rewardDisplays.push(tr.format("xpDisplay", {
				xp: completedMission.xpToWin
			}));
		}
		if (rewardDisplays.length === 0) {
			return missionDisplay;
		}
		return `${missionDisplay} (${rewardDisplays.join(", ")})
`;
	}
}