import Player from "../models/Player";
import {IMission} from "./IMission";
import {TextBasedChannel, User} from "discord.js";
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

type MissionInformations = { missionId: string, count?: number, params?: { [key: string]: unknown }, set?: boolean }
type CompletedSpecialMissions = { completedDaily: boolean, completedCampaign: boolean }

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
	 * Check and update the completed missions of the Entity
	 * @param entity
	 * @param channel
	 * @param language
	 * @param completedDaily
	 * @param completedCampaign
	 */
	static async checkCompletedMissions(
		entity: Entity,
		channel: TextBasedChannel,
		language: string,
		{completedDaily, completedCampaign}: CompletedSpecialMissions = {
			completedDaily: false,
			completedCampaign: false
		}) {
		const completedMissions = await MissionsController.completeAndUpdateMissions(entity.Player, completedDaily, completedCampaign, language);
		if (completedMissions.length !== 0) {
			await MissionsController.updatePlayerStats(entity, completedMissions, channel, language);
			await MissionsController.sendCompletedMissions(entity, completedMissions, channel, language);
		}
	}

	/**
	 * update all the mission of the user
	 * @param entity
	 * @param channel
	 * @param language
	 * @param missionInformations
	 */
	static async update(
		entity: Entity,
		channel: TextBasedChannel,
		language: string,
		{missionId, count = 1, params = {}, set = false}: MissionInformations): Promise<Entity> {

		// NE PAS ENLEVER, c'est dans le cas où une mission en accomplis une autre
		await entity.save();
		await entity.Player.save();
		const [entityTest] = await Entities.getOrRegister(entity.discordUserId);

		await MissionsController.handleExpiredMissions(entityTest.Player, draftBotClient.users.cache.get(entityTest.discordUserId), channel, language);
		const [completedDaily, completedCampaign] = await MissionsController.updateMissionsCounts(entityTest.Player, {
			missionId,
			count,
			params,
			set
		});
		await MissionsController.checkCompletedMissions(entityTest, channel, language, {
			completedDaily,
			completedCampaign
		});

		return entityTest;
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
		await player.save();
		return completedMissions;
	}

	static async sendCompletedMissions(entity: Entity, completedMissions: CompletedMission[], channel: TextBasedChannel, language: string) {
		await channel.send({
			embeds: [
				new DraftBotCompletedMissions(draftBotClient.users.cache.get(entity.discordUserId), completedMissions, language)
			]
		});
	}

	static async updatePlayerStats(entity: Entity, completedMissions: CompletedMission[], channel: TextBasedChannel, language: string) {
		for (const completedMission of completedMissions) {
			await entity.Player.PlayerMissionsInfo.addGems(completedMission.gemsToWin, entity);
			await entity.Player.addExperience(completedMission.xpToWin, entity, channel, language);
			await entity.Player.addMoney(entity, completedMission.moneyToWin, channel, language);
		}
	}

	static async handleExpiredMissions(player: Player, user: User, channel: TextBasedChannel, language: string) {
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
		await player.save();
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

	public static async generateMissionProperties(missionId: string, difficulty: MissionDifficulty, mission: Mission = null, daily = false, player: Player = null)
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
			variant: await this.getMissionInterface(mission.id).generateRandomVariant(difficulty, player)
		};
	}

	public static async addMissionToPlayer(player: Player, missionId: string, difficulty: MissionDifficulty, mission: Mission = null): Promise<MissionSlot> {
		const prop = await this.generateMissionProperties(missionId, difficulty, mission, false, player);
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

	/**
	 * update the counts of the different mission the user has
	 * @param player
	 * @param missionInformations
	 * @private
	 * @return true if the daily mission is finished and needs to be said to the player
	 */
	private static async updateMissionsCounts(player: Player, missionInformations: MissionInformations): Promise<boolean[]> {
		const missionInterface = this.getMissionInterface(missionInformations.missionId);
		const completedCampaign = await this.checkMissionSlots(player, missionInterface, missionInformations);
		if (player.PlayerMissionsInfo.hasCompletedDailyMission()) {
			return [false, completedCampaign];
		}
		const dailyMission = await DailyMissions.getOrGenerate();
		if (dailyMission.missionId !== missionInformations.missionId) {
			return [false, completedCampaign];
		}
		if (!missionInterface.areParamsMatchingVariantAndSave(dailyMission.variant, missionInformations.params, null)) {
			return [false, completedCampaign];
		}
		player.PlayerMissionsInfo.dailyMissionNumberDone += missionInformations.count;
		if (player.PlayerMissionsInfo.dailyMissionNumberDone > dailyMission.objective) {
			player.PlayerMissionsInfo.dailyMissionNumberDone = dailyMission.objective;
		}
		await player.PlayerMissionsInfo.save();
		if (player.PlayerMissionsInfo.dailyMissionNumberDone >= dailyMission.objective) {
			player.PlayerMissionsInfo.lastDailyMissionCompleted = new Date();
			await player.PlayerMissionsInfo.save();
			return [true, completedCampaign];
		}
		return [false, completedCampaign];
	}

	/**
	 * updates the missions located in the mission slots of the player
	 * @param player
	 * @param missionInterface
	 * @param missionInformations
	 * @private
	 */
	private static async checkMissionSlots(player: Player, missionInterface: IMission, missionInformations: MissionInformations) {
		let completedCampaign = false;
		for (const mission of player.MissionSlots.filter((mission) => mission.missionId === missionInformations.missionId)) {
			if (missionInterface.areParamsMatchingVariantAndSave(mission.missionVariant, missionInformations.params, mission.saveBlob)
				&& !mission.hasExpired() && !mission.isCompleted()
			) {
				completedCampaign = await this.updateMission(mission, missionInformations, completedCampaign);
			}
			if (!mission.isCompleted()) {
				await this.updateBlob(missionInterface, mission, missionInformations);
			}
		}
		return completedCampaign;
	}

	/**
	 * Updates the mission blob if needed
	 * @param missionInterface
	 * @param mission
	 * @param missionInformations
	 * @private
	 */
	private static async updateBlob(missionInterface: IMission, mission: MissionSlot, missionInformations: MissionInformations) {
		const saveBlob = await missionInterface.updateSaveBlob(mission.missionVariant, mission.saveBlob, missionInformations.params);
		if (saveBlob !== mission.saveBlob) {
			mission.saveBlob = saveBlob;
			await mission.save();
		}
	}

	/**
	 * Updates the progression of the mission
	 * @param mission
	 * @param missionInformations
	 * @param completedCampaign
	 * @private
	 */
	private static async updateMission(mission: MissionSlot, missionInformations: MissionInformations, completedCampaign: boolean) {
		mission.numberDone = missionInformations.set ? missionInformations.count : mission.numberDone + missionInformations.count;
		if (mission.numberDone > mission.missionObjective) {
			mission.numberDone = mission.missionObjective;
		}
		if (mission.isCampaign() && mission.isCompleted()) {
			completedCampaign = true;
		}
		await mission.save();
		return completedCampaign;
	}
}