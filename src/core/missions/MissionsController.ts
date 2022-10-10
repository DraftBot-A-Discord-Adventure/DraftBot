import Player, {Players} from "../database/game/models/Player";
import {IMission} from "./IMission";
import {TextBasedChannel, User} from "discord.js";
import MissionSlot, {MissionSlots} from "../database/game/models/MissionSlot";
import {DailyMissions} from "../database/game/models/DailyMission";
import Mission, {Missions} from "../database/game/models/Mission";
import {hoursToMilliseconds} from "../utils/TimeUtils";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {MissionDifficulty} from "./MissionDifficulty";
import {Data} from "../Data";
import {Campaign} from "./Campaign";
import {CompletedMission, CompletedMissionType} from "./CompletedMission";
import {DraftBotCompletedMissions} from "../messages/DraftBotCompletedMissions";
import {draftBotClient, draftBotInstance} from "../bot";
import {Translations} from "../Translations";
import {Constants} from "../Constants";
import {RandomUtils} from "../utils/RandomUtils";
import {NumberChangeReason} from "../database/logs/LogsDatabase";
import PlayerMissionsInfo, {PlayerMissionsInfos} from "../database/game/models/PlayerMissionsInfo";

type MissionInformations = { missionId: string, count?: number, params?: { [key: string]: unknown }, set?: boolean }
type CompletedSpecialMissions = { completedDaily: boolean, completedCampaign: boolean }

export class MissionsController {
	static getMissionInterface(missionId: string): IMission {
		try {
			return <IMission>(require(`./interfaces/${missionId}`).missionInterface);
		}
		catch {
			return require("./DefaultInterface").missionInterface;
		}
	}

	/**
	 * Check and update the completed missions of the Player
	 * @param player
	 * @param missionSlots
	 * @param missionInfo
	 * @param channel
	 * @param language
	 * @param completedDaily
	 * @param completedCampaign
	 */
	static async checkCompletedMissions(
		player: Player,
		missionSlots: MissionSlot[],
		missionInfo: PlayerMissionsInfo,
		channel: TextBasedChannel,
		language: string,
		{completedDaily, completedCampaign}: CompletedSpecialMissions = {
			completedDaily: false,
			completedCampaign: false
		}): Promise<void> {
		const completedMissions = await MissionsController.completeAndUpdateMissions(player, missionSlots, completedDaily, completedCampaign, language);
		if (completedMissions.length !== 0) {
			await MissionsController.updatePlayerStats(player, missionInfo, completedMissions, channel, language);
			await MissionsController.sendCompletedMissions(player, completedMissions, channel, language);
		}
	}

	/**
	 * update all the mission of the user
	 * @param player
	 * @param channel
	 * @param language
	 * @param missionInformations
	 */
	static async update(
		player: Player,
		channel: TextBasedChannel,
		language: string,
		{missionId, count = 1, params = {}, set = false}: MissionInformations): Promise<Player> {

		// NE PAS ENLEVER, c'est dans le cas où une mission en accomplit une autre
		await player.save();
		[player] = await Players.getOrRegister(player.discordUserId);
		const missionSlots = await MissionSlots.getOfPlayer(player.id);
		const missionInfo = await PlayerMissionsInfos.getOfPlayer(player.id);

		await MissionsController.handleExpiredMissions(player, missionSlots, draftBotClient.users.cache.get(player.discordUserId), channel, language);
		const [completedDaily, completedCampaign] = await MissionsController.updateMissionsCounts(player, {
			missionId,
			count,
			params,
			set
		}, missionSlots, missionInfo);
		await MissionsController.checkCompletedMissions(player, missionSlots, missionInfo, channel, language, {
			completedDaily,
			completedCampaign
		});

		return player;
	}

	/**
	 * complete and update mission of a user
	 * @param player
	 * @param missionSlots
	 * @param completedDailyMission
	 * @param completedCampaign
	 * @param language
	 */
	static async completeAndUpdateMissions(player: Player, missionSlots: MissionSlot[], completedDailyMission: boolean, completedCampaign: boolean, language: string): Promise<CompletedMission[]> {
		const completedMissions: CompletedMission[] = [];
		completedMissions.push(...await Campaign.updatePlayerCampaign(completedCampaign, player, language));
		for (const mission of missionSlots) {
			if (mission.isCompleted() && !mission.isCampaign()) {
				const missionModel = await Missions.getById(mission.missionId);
				completedMissions.push(
					new CompletedMission(
						mission.xpToWin,
						0, // Don't win gems in secondary missions
						mission.moneyToWin,
						await missionModel.formatDescription(mission.missionObjective, mission.missionVariant, language, mission.saveBlob),
						CompletedMissionType.NORMAL
					)
				);
				draftBotInstance.logsDatabase.logMissionFinished(player.discordUserId, mission.missionId, mission.missionVariant, mission.missionObjective).then();
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
			draftBotInstance.logsDatabase.logMissionDailyFinished(player.discordUserId).then();
		}
		await player.save();
		return completedMissions;
	}

	static async sendCompletedMissions(player: Player, completedMissions: CompletedMission[], channel: TextBasedChannel, language: string): Promise<void> {
		await channel.send({
			embeds: [
				new DraftBotCompletedMissions(draftBotClient.users.cache.get(player.discordUserId), completedMissions, language)
			]
		});
	}

	static async updatePlayerStats(player: Player, missionInfo: PlayerMissionsInfo, completedMissions: CompletedMission[], channel: TextBasedChannel, language: string): Promise<void> {
		for (const completedMission of completedMissions) {
			await missionInfo.addGems(completedMission.gemsToWin, player.discordUserId, NumberChangeReason.MISSION_FINISHED);
			await player.addExperience({
				amount: completedMission.xpToWin,
				channel,
				language,
				reason: NumberChangeReason.MISSION_FINISHED
			});
			await player.addMoney({
				amount: completedMission.moneyToWin,
				channel,
				language,
				reason: NumberChangeReason.MISSION_FINISHED
			});
		}
	}

	static async handleExpiredMissions(player: Player, missionSlots: MissionSlot[], user: User, channel: TextBasedChannel, language: string): Promise<void> {
		const expiredMissions: MissionSlot[] = [];
		for (const mission of missionSlots) {
			if (mission.hasExpired()) {
				expiredMissions.push(mission);
				draftBotInstance.logsDatabase.logMissionFailed(player.discordUserId, mission.missionId, mission.missionVariant, mission.missionObjective).then();
				await mission.destroy();
			}
		}
		if (expiredMissions.length === 0) {
			return;
		}
		const tr = Translations.getModule("models.missions", language);
		let missionsExpiredDesc = "";
		for (const mission of expiredMissions) {
			const missionModel = await Missions.getById(mission.missionId);
			missionsExpiredDesc += `- ${await missionModel.formatDescription(
				mission.missionObjective, mission.missionVariant, language, mission.saveBlob
			)} (${mission.numberDone}/${mission.missionObjective})\n`;
		}
		await player.save();
		await channel.send({
			embeds: [
				new DraftBotEmbed()
					.setAuthor({
						name: tr.format(
							"missionsExpiredTitle",
							{
								missionsCount: expiredMissions.length,
								pseudo: player.getPseudo(language)
							}
						),
						iconURL: user.displayAvatarURL()
					})
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
		const missionData = Data.getModule(`missions.${missionId}`);
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
		const retMission = await MissionSlots.getById(missionSlot.id);
		draftBotInstance.logsDatabase.logMissionFound(player.discordUserId, retMission.missionId, retMission.missionVariant, retMission.missionObjective).then();
		return retMission;
	}

	public static async addRandomMissionToPlayer(player: Player, difficulty: MissionDifficulty): Promise<MissionSlot> {
		const mission = await Missions.getRandomMission(difficulty);
		return await MissionsController.addMissionToPlayer(player, mission.id, difficulty, mission);
	}

	public static async getVariantFormatText(missionId: string, variant: number, objective: number, language: string, saveBlob: Buffer): Promise<string> {
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
	 * @param missionSlots
	 * @param missionInfo
	 * @private
	 * @return true if the daily mission is finished and needs to be said to the player
	 */
	private static async updateMissionsCounts(player: Player, missionInformations: MissionInformations, missionSlots: MissionSlot[], missionInfo: PlayerMissionsInfo): Promise<boolean[]> {
		const missionInterface = this.getMissionInterface(missionInformations.missionId);
		const completedCampaign = await this.checkMissionSlots(player, missionInterface, missionInformations, missionSlots);
		if (missionInfo.hasCompletedDailyMission()) {
			return [false, completedCampaign];
		}
		const dailyMission = await DailyMissions.getOrGenerate();
		if (dailyMission.missionId !== missionInformations.missionId) {
			return [false, completedCampaign];
		}
		if (!missionInterface.areParamsMatchingVariantAndSave(dailyMission.variant, missionInformations.params, null)) {
			return [false, completedCampaign];
		}
		missionInfo.dailyMissionNumberDone += missionInformations.count;
		if (missionInfo.dailyMissionNumberDone > dailyMission.objective) {
			missionInfo.dailyMissionNumberDone = dailyMission.objective;
		}
		await missionInfo.save();
		if (missionInfo.dailyMissionNumberDone >= dailyMission.objective) {
			missionInfo.lastDailyMissionCompleted = new Date();
			await missionInfo.save();
			return [true, completedCampaign];
		}
		return [false, completedCampaign];
	}

	/**
	 * updates the missions located in the mission slots of the player
	 * @param player
	 * @param missionInterface
	 * @param missionInformations
	 * @param missionSlots
	 * @private
	 */
	private static async checkMissionSlots(player: Player, missionInterface: IMission, missionInformations: MissionInformations, missionSlots: MissionSlot[]): Promise<boolean> {
		let completedCampaign = false;
		for (const mission of missionSlots.filter((mission) => mission.missionId === missionInformations.missionId)) {
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
	private static async updateBlob(missionInterface: IMission, mission: MissionSlot, missionInformations: MissionInformations): Promise<void> {
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
	private static async updateMission(mission: MissionSlot, missionInformations: MissionInformations, completedCampaign: boolean): Promise<boolean> {
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