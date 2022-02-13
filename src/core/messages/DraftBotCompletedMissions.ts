import {DraftBotEmbed} from "./DraftBotEmbed";
import {User} from "discord.js";
import {TranslationModule, Translations} from "../Translations";
import {CompletedMission, CompletedMissionType} from "../missions/CompletedMission";
import {escapeUsername} from "../utils/StringUtils";

export class DraftBotCompletedMissions extends DraftBotEmbed {
	constructor(user: User, completedMissions: CompletedMission[], language: string) {
		super();
		const tr = Translations.getModule("models.missions", language);
		this.setAuthor(tr.format("completedTitle", {
			missionCount: completedMissions.length,
			pseudo: escapeUsername(user.username)
		}), user.displayAvatarURL());
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
			this.addField(tr.format("campaign", {
				missionCount: completedMissions.filter(mission => mission.completedMissionType === CompletedMissionType.CAMPAIGN).length
			}), campaignMissions);
		}
		if (dailyMission.length !== 0) {
			this.addField(tr.format("daily", {
				missionCount: completedMissions.filter(mission => mission.completedMissionType === CompletedMissionType.DAILY).length
			}), dailyMission);
		}
		if (sideMissions.length !== 0) {
			this.addField(tr.format("sideMissions", {
				missionCount: completedMissions.filter(mission => mission.completedMissionType === CompletedMissionType.NORMAL).length
			}), sideMissions);
		}
		if (completedMissions.length > 1) {
			this.addField(tr.get("totalRewards"), tr.format("totalDisplay", {
				gems: totalGems,
				xp: totalXP
			}));
		}
	}

	private static getMissionDisplay(tr: TranslationModule, completedMission: CompletedMission): string {
		const rewardDisplays = [];
		const missionDisplay = "• " + completedMission.desc;
		if (completedMission.gemsToWin > 0) {
			rewardDisplays.push(tr.format("gemsDisplay", {
				gems: completedMission.gemsToWin
			}));
		}
		if (completedMission.xpToWin) {
			rewardDisplays.push(tr.format("xpDisplay", {
				xp: completedMission.xpToWin
			}));
		}
		if (completedMission.moneyToWin) {
			rewardDisplays.push(tr.format("moneyDisplay", {
				money: completedMission.moneyToWin
			}));
		}
		if (rewardDisplays.length === 0) {
			return missionDisplay + "\n";
		}
		return missionDisplay + " (" + rewardDisplays.join(", ") + ")\n";
	}
}