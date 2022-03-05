import Player from "../models/Player";
import {IMission} from "./IMission";
import {TextChannel, User} from "discord.js";
import MissionSlot, {MissionSlots} from "../models/MissionSlot";
import {DailyMissions} from "../models/DailyMission";
import Mission, {Missions} from "../models/Mission";
import {hoursToMilliseconds} from "../utils/TimeUtils";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {MissionDifficulty} from "./MissionDifficulty";
import {Data} from "../Data";
import {Campaign} from "./Campaign";
import {Entities, Entity} from "../models/Entity";
import {CompletedMission, CompletedMissionType} from "./CompletedMission";
import {DraftBotCompletedMissions} from "../messages/DraftBotCompletedMissions";
import {draftBotClient} from "../bot";
import {Translations} from "../Translations";
import {Constants} from "../Constants";
import {RandomUtils} from "../utils/RandomUtils";

export class MissionsController {
	static getMissionInterface(missionId: string): IMission {
		try {
			return <IMission>(require("./interfaces/" + missionId).missionInterface);
		}
		catch {
			return require("./DefaultInterface").missionInterface;
		}
	}


	/**
	 * update all the mission of the user
	 * @param discordUserId
	 * @param channel
	 * @param language
	 * @param missionId
	 * @param count
	 * @param params
	 * @param set
	 */// eslint-disable-next-line max-params
	static async update(discordUserId: string, channel: TextChannel, language: string, missionId: string, count = 1, params: { [key: string]: any } = {}, set = false): Promise<void> {
		if (!discordUserId) {
			console.error("Cannot update mission because discordUserId is not defined");
			console.error("Data: discordUserId = " + discordUserId + "; channel = " + channel + "; missionId = " + missionId + "; count = " + count + "; params = " + params);
			return;
		}
		const [entity] = await Entities.getOrRegister(discordUserId);
		await MissionsController.handleExpiredMissions(entity.Player, draftBotClient.users.cache.get(discordUserId), channel, language);
		const [completedDaily, completedCampaign] = await MissionsController.updateMissionsCounts(entity.Player, missionId, count, params, set);
		const completedMissions = await MissionsController.completeAndUpdateMissions(entity.Player, completedDaily, completedCampaign, language);
		if (completedMissions.length !== 0) {
			await MissionsController.updatePlayerStats(entity, completedMissions, channel, language);
			await MissionsController.sendCompletedMissions(discordUserId, entity.Player, completedMissions, channel, language);
		}
	}

	/**
	 * update the counts of the different mission the user has
	 * @param player
	 * @param missionId
	 * @param count
	 * @param params
	 * @param set
	 * @private
	 * @return true if the daily mission is finished and needs to be said to the player
	 */
	private static async updateMissionsCounts(player: Player, missionId: string, count = 1, params: { [key: string]: any } = {}, set = false): Promise<boolean[]> {
		const missionInterface = this.getMissionInterface(missionId);
		let completedCampaign = false;
		completedCampaign = await this.checkMissionSlots(player, missionId, missionInterface, params, set, count, completedCampaign);
		if (!player.PlayerMissionsInfo.hasCompletedDailyMission()) {
			const dailyMission = await DailyMissions.getOrGenerate();
			if (dailyMission.missionId === missionId) {
				if (missionInterface.areParamsMatchingVariantAndSave(dailyMission.variant, params, null)) {
					player.PlayerMissionsInfo.dailyMissionNumberDone += count;
					if (player.PlayerMissionsInfo.dailyMissionNumberDone > dailyMission.objective) {
						player.PlayerMissionsInfo.dailyMissionNumberDone = dailyMission.objective;
					}
					await player.PlayerMissionsInfo.save();
					if (player.PlayerMissionsInfo.dailyMissionNumberDone >= dailyMission.objective) {
						player.PlayerMissionsInfo.lastDailyMissionCompleted = new Date();
						await player.PlayerMissionsInfo.save();
						return [true, completedCampaign];
					}
				}
			}
		}
		return [false, completedCampaign];
	}


	/**
	 * updates the missions located in the mission slots of the player
	 * @param player
	 * @param missionId
	 * @param missionInterface
	 * @param params
	 * @param set
	 * @param count
	 * @param completedCampaign
	 * @private
	 */
	// eslint-disable-next-line max-params
	private static async checkMissionSlots(player: Player, missionId: string, missionInterface: IMission, params: { [p: string]: any }, set: boolean, count: number, completedCampaign: boolean) {
		for (const mission of player.MissionSlots) {
			if (mission.missionId === missionId) {
				if (missionInterface.areParamsMatchingVariantAndSave(mission.missionVariant, params, mission.saveBlob)
					&& !mission.hasExpired() && !mission.isCompleted()
				) {
					if (set) {
						mission.numberDone = count;
					}
					else {
						mission.numberDone += count;
					}
					if (mission.numberDone > mission.missionObjective) {
						mission.numberDone = mission.missionObjective;
					}
					if (mission.isCampaign() && mission.isCompleted()) {
						completedCampaign = true;
					}
					await mission.save();
				}
				if (!mission.isCompleted()) {
					const saveBlob = await missionInterface.updateSaveBlob(mission.missionVariant, mission.saveBlob, params);
					if (saveBlob !== mission.saveBlob) {
						mission.saveBlob = saveBlob;
						await mission.save();
					}
				}
			}
		}
		return completedCampaign;
	}

	/**
	 * complete and update mission of a user
	 * @param player
	 * @param completedDailyMission
	 * @param completedCampaign
	 * @param language
	 */
	static async completeAndUpdateMissions(player: Player, completedDailyMission: boolean, completedCampaign: boolean, language: string): Promise<CompletedMission[]> {
		const completedMissions: CompletedMission[] = [];
		completedMissions.push(...await Campaign.updatePlayerCampaign(completedCampaign, player, language));
		for (const mission of player.MissionSlots) {
			if (mission.isCompleted() && !mission.isCampaign()) {
				completedMissions.push(
					new CompletedMission(
						mission.xpToWin,
						0, // Don't win gems in secondary missions
						mission.moneyToWin,
						await mission.Mission.formatDescription(mission.missionObjective, mission.missionVariant, language, mission.saveBlob),
						CompletedMissionType.NORMAL
					)
				);
				await mission.destroy();
			}
		}
		if (completedDailyMission) {
			const dailyMission = await DailyMissions.getOrGenerate();
			completedMissions.push(new CompletedMission(
				dailyMission.xpToWin,
				dailyMission.gemsToWin,
				Math.round(dailyMission.moneyToWin / Constants.MISSIONS.DAILY_MISSION_MONEY_PENALITY), // daily missions gives less money than secondary missions
				await dailyMission.Mission.formatDescription(dailyMission.objective, dailyMission.variant, language, null),
				CompletedMissionType.DAILY
			));
		}
		return completedMissions;
	}

	static async sendCompletedMissions(discordUserId: string, player: Player, completedMissions: CompletedMission[], channel: TextChannel, language: string) {
		await channel.send({
			embeds: [
				new DraftBotCompletedMissions(draftBotClient.users.cache.get(discordUserId), completedMissions, language)
			]
		});
	}

	static async updatePlayerStats(entity: Entity, completedMissions: CompletedMission[], channel: TextChannel, language: string) {
		for (const completedMission of completedMissions) {
			entity.Player.PlayerMissionsInfo.gems += completedMission.gemsToWin;
			await entity.Player.addExperience(completedMission.xpToWin, entity, channel, language);
			await entity.Player.addMoney(entity, completedMission.moneyToWin, channel, language);
		}
		await entity.Player.PlayerMissionsInfo.save();
		await entity.Player.save();
	}

	static async handleExpiredMissions(player: Player, user: User, channel: TextChannel, language: string) {
		const expiredMissions: MissionSlot[] = [];
		for (const mission of player.MissionSlots) {
			if (mission.hasExpired()) {
				expiredMissions.push(mission);
				await mission.destroy();
			}
		}
		if (expiredMissions.length === 0) {
			return;
		}
		player.MissionSlots = player.MissionSlots.filter(missionSlot => !missionSlot.hasExpired());
		const tr = Translations.getModule("models.missions", language);
		let missionsExpiredDesc = "";
		for (const mission of expiredMissions) {
			missionsExpiredDesc += "- " + await mission.Mission.formatDescription(
				mission.missionObjective, mission.missionVariant, language, mission.saveBlob) + " (" + mission.numberDone + "/" + mission.missionObjective + ")\n";
		}
		await channel.send({
			embeds: [
				new DraftBotEmbed()
					.setAuthor(tr.format(
						"missionsExpiredTitle",
						{
							missionsCount: expiredMissions.length,
							pseudo: await player.getPseudo(language)
						}
					), user.displayAvatarURL())
					.setDescription(tr.format(
						"missionsExpiredDesc",
						{
							missionsCount: expiredMissions.length,
							missionsExpired: missionsExpiredDesc
						}
					))
			]
		});
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
			variant: await this.getMissionInterface(mission.id).generateRandomVariant(difficulty)
		};
	}

	public static async addMissionToPlayer(player: Player, missionId: string, difficulty: MissionDifficulty, mission: Mission = null): Promise<MissionSlot> {
		const prop = await this.generateMissionProperties(missionId, difficulty, mission);
		const missionData = Data.getModule("missions." + missionId);
		const missionSlot = await MissionSlot.create({
			playerId: player.id,
			missionId: prop.mission.id,
			missionVariant: prop.variant,
			missionObjective: missionData.getNumberFromArray("objectives", prop.index),
			expiresAt: new Date(Date.now() + hoursToMilliseconds(missionData.getNumberFromArray("expirations", prop.index))),
			numberDone: await this.getMissionInterface(missionId).initialNumberDone(player, prop.variant),
			gemsToWin: missionData.getNumberFromArray("gems", prop.index),
			xpToWin: missionData.getNumberFromArray("xp", prop.index),
			moneyToWin: missionData.getNumberFromArray("money", prop.index)
		});
		return await MissionSlots.getById(missionSlot.id);
	}

	public static async addRandomMissionToPlayer(player: Player, difficulty: MissionDifficulty): Promise<MissionSlot> {
		const mission = await Missions.getRandomMission(difficulty);
		return await MissionsController.addMissionToPlayer(player, mission.id, difficulty, mission);
	}

	public static async getVariantFormatText(missionId: string, variant: number, objective: number, language: string, saveBlob: Buffer) {
		return await this.getMissionInterface(missionId).getVariantFormatVariable(variant, objective, language, saveBlob);
	}

	public static getRandomDifficulty(player: Player): MissionDifficulty {
		for (let i = Constants.MISSIONS.SLOTS_LEVEL_PROBABILITIES.length - 1; i >= 0; i--) {
			const probability = Constants.MISSIONS.SLOTS_LEVEL_PROBABILITIES[i];
			if (player.level >= probability.LEVEL) {
				const randomNumber = RandomUtils.draftbotRandom.realZeroToOneInclusive();
				return randomNumber < probability.EASY ? MissionDifficulty.EASY : randomNumber < probability.MEDIUM + probability.EASY ? MissionDifficulty.MEDIUM : MissionDifficulty.HARD;
			}
		}
	}
}