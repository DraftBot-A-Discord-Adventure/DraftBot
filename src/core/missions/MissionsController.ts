import Player from "../models/Player";
import {IMission} from "./IMission";
import {TextChannel} from "discord.js";
import MissionSlot from "../models/MissionSlot";
import DailyMission, {DailyMissions} from "../models/DailyMission";
import Mission, {Missions} from "../models/Mission";
import {RandomUtils} from "../utils/RandomUtils";
import {Constants} from "../Constants";
import {hoursToMilliseconds} from "../utils/TimeUtils";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";

export class MissionsController {
	static async update(player: Player, channel: TextChannel, language: string, missionId: string, count = 1, params: { [key: string]: any } = {}): Promise<boolean> {
		const missionInterface: IMission | null = <IMission>(require("./interfaces/" + missionId).missionInterface);
		if (!missionInterface) {
			return false;
		}

		const variant = missionInterface.paramsToVariant(params);
		let updated = false;
		const completedMission = [];
		for (const mission of player.MissionSlots) {
			if (mission.missionId === missionId && mission.missionVariant === variant) {
				updated = true;
				mission.numberDone += count;
				await mission.save();
				if (mission.isCompleted()) {
					completedMission.push(mission);
				}
			}
		}
		await MissionsController.completeMissionSlots(player, channel, language, completedMission);
		if (!player.MissionsInfo.hasCompletedDailyMission()) {
			const dailyMission = await DailyMissions.getOrGenerate();
			if (dailyMission.variant === variant) {
				player.MissionsInfo.dailyMissionNumberDone += count;
				if (player.MissionsInfo.dailyMissionNumberDone >= dailyMission.objective) {
					await MissionsController.completeDailyMission(player, channel, language, dailyMission);
				}
				else {
					await player.MissionsInfo.save();
				}
			}
		}

		return updated;
	}

	public static async completeMissionSlots(player: Player, channel: TextChannel, language: string, missionSlots: MissionSlot[]) {
		let desc = "";
		let xpWon = 0;
		let gemsWon = 0;
		for (const missionSlot of missionSlots) {
			const rewards = MissionsController.rewardsForMission(missionSlot.Mission, missionSlot.missionObjective);
			xpWon += rewards.xp;
			gemsWon += rewards.gems;
			if (missionSlot.isCampaign()) {
				player.MissionsInfo.campaignProgression++;
			}
			desc += "- " + missionSlot.Mission.formatDescription(missionSlot.missionObjective, language) + "\n";
		}
		channel.send({
			embeds: [
				new DraftBotEmbed()
					.setTitle("Mission")
					.setDescription(await player.getPseudo(language) + " completed the following mission(s):\n" + desc + "\n**xp Won:** " + xpWon + "\n**gems Won:** " + gemsWon)
			]
		}).then();

		player.MissionsInfo.gems += gemsWon;
		player.experience += xpWon;
		for (const missionSlot of missionSlots) {
			await missionSlot.destroy();
		}
		await player.MissionsInfo.save();
		await player.save();
	}

	public static async completeDailyMission(player: Player, channel: TextChannel, language: string, dailyMission: DailyMission = null) {
		if (!dailyMission) {
			dailyMission = await DailyMissions.getOrGenerate();
		}
		const rewards = MissionsController.rewardsForMission(dailyMission.Mission, dailyMission.objective);
		const xpWon = rewards.xp;
		const gemsWon = rewards.gems;
		channel.send({
			embeds: [
				new DraftBotEmbed()
					.setTitle("Mission")
					.setDescription(await player.getPseudo(language) + " completed the daily mission:\n"
						+ dailyMission.Mission.formatDescription(dailyMission.objective, language) + "\n\n**xp Won:** " + xpWon + "\n**gems Won:** " + gemsWon)
			]
		}).then();

		player.MissionsInfo.gems += rewards.gems;
		player.MissionsInfo.lastDailyMissionCompleted = new Date();
		player.experience += rewards.xp;
		await player.MissionsInfo.save();
		await player.save();
	}

	public static rewardsForMission(mission: Mission, objective: number): { xp: number, gems: number } {
		return {
			xp: Math.round(mission.xp * objective / mission.baseDifficulty),
			gems: Math.round(mission.gems * objective / mission.baseDifficulty)
		};
	}

	public static async generateRandomMissionProperties(difficulty: number): Promise<{ mission: Mission, objective: number, variant: number }> {
		const mission = await Missions.getRandomMission();
		return {
			mission: mission,
			objective: mission.baseDifficulty * difficulty,
			variant: (<IMission>(require("./interfaces/" + mission.id).missionInterface)).generateRandomVariant()
		};
	}

	public static async addRandomMissionToPlayer(player: Player, difficulty = -1): Promise<MissionSlot> {
		if (difficulty === -1) {
			difficulty = RandomUtils.draftbotRandom.integer(Constants.MISSION.MIN_DIFFICULTY, Constants.MISSION.MAX_DIFFICULTY);
		}
		const prop = await this.generateRandomMissionProperties(difficulty);
		return await MissionSlot.create({
			playerId: player.id,
			missionId: prop.mission.id,
			missionVariant: prop.variant,
			missionObjective: prop.mission.objectiveForDifficulty(difficulty),
			expiresAt: new Date(Date.now() + hoursToMilliseconds(prop.mission.durationForDifficulty(difficulty))),
			numberDone: 0
		});
	}
}