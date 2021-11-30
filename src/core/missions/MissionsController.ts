import Player from "../models/Player";
import {IMission} from "./IMission";
import {TextChannel} from "discord.js";
import MissionSlot from "../models/MissionSlot";
import DailyMission, {DailyMissions} from "../models/DailyMission";
import Mission, {Missions} from "../models/Mission";
import {hoursToMilliseconds} from "../utils/TimeUtils";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {MissionDifficulty} from "./MissionDifficulty";
import {Data} from "../Data";
import {Campaign} from "./Campaign";

export class MissionsController {
	static getMissionInterface(missionId: string): IMission {
		try {
			return <IMission>(require("./interfaces/" + missionId).missionInterface);
		}
		catch {
			return require("./DefaultInterface").missionInterface;
		}
	}

	static async update(player: Player, channel: TextChannel, language: string, missionId: string, count = 1, params: { [key: string]: any } = {}): Promise<boolean> {
		await Campaign.updatePlayerCampaign(player);
		const missionInterface = this.getMissionInterface(missionId);

		let updated = false;
		const completedMission = [];
		for (const mission of player.MissionSlots) {
			if (mission.missionId === missionId && missionInterface.areParamsMatchingVariant(mission.missionVariant, params) && !mission.hasExpired() && !mission.isCompleted()) {
				updated = true;
				mission.numberDone += count;
				if (mission.numberDone > mission.missionObjective) {
					mission.numberDone = mission.missionObjective;
				}
				await mission.save();
				if (mission.isCompleted()) {
					completedMission.push(mission);
					if (mission.isCampaign()) {
						await Campaign.updatePlayerCampaign(player);
					}
				}
			}
		}
		if (completedMission.length > 0) {
			await MissionsController.completeMissionSlots(player, channel, language, completedMission);
		}
		if (!player.PlayerMissionsInfo.hasCompletedDailyMission()) {
			const dailyMission = await DailyMissions.getOrGenerate();
			if (dailyMission.missionId === missionId) {
				if (missionInterface.areParamsMatchingVariant(dailyMission.variant, params)) {
					updated = true;
					player.PlayerMissionsInfo.dailyMissionNumberDone += count;
					if (player.PlayerMissionsInfo.dailyMissionNumberDone > dailyMission.objective) {
						player.PlayerMissionsInfo.dailyMissionNumberDone = dailyMission.objective;
					}
					if (player.PlayerMissionsInfo.dailyMissionNumberDone >= dailyMission.objective) {
						await MissionsController.completeDailyMission(player, channel, language, dailyMission);
					}
					else {
						await player.PlayerMissionsInfo.save();
					}
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
			xpWon += missionSlot.xpToWin;
			gemsWon += missionSlot.gemsToWin;
			if (missionSlot.isCampaign()) {
				await Campaign.updatePlayerCampaign(player);
			}
			desc += "- " + missionSlot.Mission.formatDescription(missionSlot.missionObjective, missionSlot.missionVariant, language) + "\n";
		}
		channel.send({
			embeds: [
				new DraftBotEmbed()
					.setTitle("Mission")
					.setDescription(await player.getPseudo(language) + " completed the following mission(s):\n" + desc + "\n**xp Won:** " + xpWon + "\n**gems Won:** " + gemsWon)
			]
		}).then();

		player.PlayerMissionsInfo.gems += gemsWon;
		player.experience += xpWon;
		for (const missionSlot of missionSlots) {
			if (!missionSlot.isCampaign()) {
				await missionSlot.destroy();
			}
		}
		await player.PlayerMissionsInfo.save();
		await player.save();
	}

	public static async completeDailyMission(player: Player, channel: TextChannel, language: string, dailyMission: DailyMission = null) {
		if (!dailyMission) {
			dailyMission = await DailyMissions.getOrGenerate();
		}
		const xpWon = dailyMission.xpToWin;
		const gemsWon = dailyMission.gemsToWin;
		channel.send({
			embeds: [
				new DraftBotEmbed()
					.setTitle("Mission")
					.setDescription(await player.getPseudo(language) + " completed the daily mission:\n"
						+ dailyMission.Mission.formatDescription(dailyMission.objective, dailyMission.variant, language) + "\n\n**xp Won:** " + xpWon + "\n**gems Won:** " + gemsWon)
			]
		}).then();

		player.PlayerMissionsInfo.gems += gemsWon;
		player.PlayerMissionsInfo.lastDailyMissionCompleted = new Date();
		player.experience += xpWon;
		await player.PlayerMissionsInfo.save();
		await player.save();
	}

	public static async generateRandomDailyMissionProperties(): Promise<{ mission: Mission, index: number, variant: number }> {
		const mission = await Missions.getRandomDailyMission();
		return this.generateMissionProperties(mission.id, MissionDifficulty.EASY, mission, true);
	}

	public static async generateMissionProperties(missionId: string, difficulty: MissionDifficulty, mission: Mission = null, daily = false)
		: Promise<{ mission: Mission, index: number, variant: number } | null> {
		if (!mission) {
			mission = await Missions.getById(missionId);
			if (!mission) {
				return null;
			}
		}
		const missionData = Data.getModule("missions." + missionId);
		let index;
		if (!daily) {
			switch (difficulty) {
			case MissionDifficulty.EASY:
				if (!mission.canBeEasy) {
					return null;
				}
				index = missionData.getRandomNumberFromArray("difficulties.easy");
				break;
			case MissionDifficulty.MEDIUM:
				if (!mission.canBeMedium) {
					return null;
				}
				index = missionData.getRandomNumberFromArray("difficulties.medium");
				break;
			case MissionDifficulty.HARD:
				if (!mission.canBeHard) {
					return null;
				}
				index = missionData.getRandomNumberFromArray("difficulties.hard");
				break;
			default:
				return null;
			}
		}
		else {
			index = missionData.getRandomNumberFromArray("dailyIndexes");
		}
		return {
			mission: mission,
			index,
			variant: this.getMissionInterface(mission.id).generateRandomVariant(difficulty)
		};
	}

	public static async addMissionToPlayer(playerId: number, missionId: string, difficulty: MissionDifficulty, mission: Mission = null): Promise<MissionSlot> {
		const prop = await this.generateMissionProperties(missionId, difficulty, mission);
		const missionData = Data.getModule("missions." + missionId);
		return await MissionSlot.create({
			playerId: playerId,
			missionId: prop.mission.id,
			missionVariant: prop.variant,
			missionObjective: missionData.getNumberFromArray("objectives", prop.index),
			expiresAt: new Date(Date.now() + hoursToMilliseconds(missionData.getNumberFromArray("expirations", prop.index))),
			numberDone: 0,
			gemsToWin: missionData.getNumberFromArray("gems", prop.index),
			xpToWin: missionData.getNumberFromArray("xp", prop.index)
		});
	}

	public static async addRandomMissionToPlayer(player: Player, difficulty: MissionDifficulty): Promise<MissionSlot> {
		const mission = await Missions.getRandomMission(difficulty);
		return await MissionsController.addMissionToPlayer(player.id, mission.id, difficulty, mission);
	}

	public static getVariantFormatText(missionId: string, variant: number) {
		return this.getMissionInterface(missionId).getVariantFormatVariable(variant);
	}
}