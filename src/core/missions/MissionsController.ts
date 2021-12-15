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
import {Entities} from "../models/Entity";

export class MissionsController {
	static getMissionInterface(missionId: string): IMission {
		try {
			return <IMission>(require("./interfaces/" + missionId).missionInterface);
		}
		catch {
			return require("./DefaultInterface").missionInterface;
		}
	}

	// eslint-disable-next-line max-params
	static async update(discordUserId: string, channel: TextChannel, language: string, missionId: string, count = 1, params: { [key: string]: any } = {}, set = false): Promise<boolean> {
		const [entity] = await Entities.getOrRegister(discordUserId);
		await Campaign.updatePlayerCampaign(entity.Player, channel, language);
		const missionInterface = this.getMissionInterface(missionId);

		let updated = false;
		const completedMission = [];
		for (const mission of entity.Player.MissionSlots) {
			if (mission.missionId === missionId && missionInterface.areParamsMatchingVariant(mission.missionVariant, params) && !mission.hasExpired() && !mission.isCompleted()) {
				updated = true;
				if (set) {
					mission.numberDone = count;
				}
				else {
					mission.numberDone += count;
				}
				if (mission.numberDone > mission.missionObjective) {
					mission.numberDone = mission.missionObjective;
				}
				await mission.save();
				if (mission.isCompleted()) {
					completedMission.push(mission);
				}
			}
		}
		if (completedMission.length > 0) {
			await MissionsController.completeMissionSlots(entity.Player, channel, language, completedMission);
		}
		if (!entity.Player.PlayerMissionsInfo.hasCompletedDailyMission()) {
			const dailyMission = await DailyMissions.getOrGenerate();
			if (dailyMission.missionId === missionId) {
				if (missionInterface.areParamsMatchingVariant(dailyMission.variant, params)) {
					updated = true;
					entity.Player.PlayerMissionsInfo.dailyMissionNumberDone += count;
					if (entity.Player.PlayerMissionsInfo.dailyMissionNumberDone > dailyMission.objective) {
						entity.Player.PlayerMissionsInfo.dailyMissionNumberDone = dailyMission.objective;
					}
					if (entity.Player.PlayerMissionsInfo.dailyMissionNumberDone >= dailyMission.objective) {
						await MissionsController.completeDailyMission(entity.Player, channel, language, dailyMission);
					}
					else {
						await entity.Player.PlayerMissionsInfo.save();
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
			desc += "- " + await missionSlot.Mission.formatDescription(missionSlot.missionObjective, missionSlot.missionVariant, language) + "\n";
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

		await player.PlayerMissionsInfo.save();
		await player.save();

		for (const missionSlot of missionSlots) {
			if (!missionSlot.isCampaign()) {
				await missionSlot.destroy();
			}
			else {
				await Campaign.updatePlayerCampaign(player, channel, language);
			}
		}
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
						+ await dailyMission.Mission.formatDescription(dailyMission.objective, dailyMission.variant, language) + "\n\n**xp Won:** " + xpWon + "\n**gems Won:** " + gemsWon)
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

	public static async addMissionToPlayer(player: Player, missionId: string, difficulty: MissionDifficulty, mission: Mission = null): Promise<MissionSlot> {
		const prop = await this.generateMissionProperties(missionId, difficulty, mission);
		const missionData = Data.getModule("missions." + missionId);
		return await MissionSlot.create({
			playerId: player.id,
			missionId: prop.mission.id,
			missionVariant: prop.variant,
			missionObjective: missionData.getNumberFromArray("objectives", prop.index),
			expiresAt: new Date(Date.now() + hoursToMilliseconds(missionData.getNumberFromArray("expirations", prop.index))),
			numberDone: await this.getMissionInterface(missionId).initialNumberDone(player, prop.variant),
			gemsToWin: missionData.getNumberFromArray("gems", prop.index),
			xpToWin: missionData.getNumberFromArray("xp", prop.index)
		});
	}

	public static async addRandomMissionToPlayer(player: Player, difficulty: MissionDifficulty): Promise<MissionSlot> {
		const mission = await Missions.getRandomMission(difficulty);
		return await MissionsController.addMissionToPlayer(player, mission.id, difficulty, mission);
	}

	public static async getVariantFormatText(missionId: string, variant: number, language: string) {
		return await this.getMissionInterface(missionId).getVariantFormatVariable(variant, language);
	}
}