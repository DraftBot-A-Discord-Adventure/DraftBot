import Player from "../database/game/models/Player";
import {IMission} from "./IMission";
import MissionSlot, {MissionSlots} from "../database/game/models/MissionSlot";
import {DailyMissions} from "../database/game/models/DailyMission";
import {hoursToMilliseconds} from "../../../../Lib/src/utils/TimeUtils";
import {MissionDifficulty} from "./MissionDifficulty";
import {Campaign} from "./Campaign";
import {Constants} from "../Constants";
import {RandomUtils} from "../utils/RandomUtils";
import {NumberChangeReason} from "../constants/LogsConstants";
import PlayerMissionsInfo, {PlayerMissionsInfos} from "../database/game/models/PlayerMissionsInfo";
import {DraftBotPacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {MissionsExpiredPacket} from "../../../../Lib/src/packets/notifications/MissionsExpiredPacket";
import {draftBotInstance} from "../../index";
import {Mission, MissionDataController} from "../../data/Mission";
import {MissionsCompletedPacket} from "../../../../Lib/src/packets/notifications/MissionsCompletedPacket";
import {CompletedMission, CompletedMissionType} from "../../../../Lib/src/interfaces/CompletedMission";

type MissionInformations = {
	missionId: string,
	count?: number,
	params?: {
		[key: string]: unknown
	},
	set?: boolean
}
type CompletedSpecialMissions = {
	completedDaily: boolean,
	completedCampaign: boolean
}

export class MissionsController {
	static getMissionInterface(missionId: string): IMission {
		try {
			return <IMission>((require(`./interfaces/${missionId}`) as {
				missionInterface: IMission
			}).missionInterface);
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
	 * @param response the response packets
	 * @param completedDaily
	 * @param completedCampaign
	 */
	static async checkCompletedMissions(
		player: Player,
		missionSlots: MissionSlot[],
		missionInfo: PlayerMissionsInfo,
		response: DraftBotPacket[],
		{completedDaily, completedCampaign}: CompletedSpecialMissions = {
			completedDaily: false,
			completedCampaign: false
		}
	): Promise<Player> {
		const completedMissions = await MissionsController.completeAndUpdateMissions(player, missionSlots, completedDaily, completedCampaign);
		if (completedMissions.length !== 0) {
			player = await MissionsController.updatePlayerStats(player, missionInfo, completedMissions, response);
			const packet: MissionsCompletedPacket = {missions: completedMissions};
			response.push(packet);
		}
		return player;
	}

	/**
	 * Update all the mission of the user
	 * @param player
	 * @param response the response packets
	 * @param missionId
	 * @param count
	 * @param params
	 * @param set
	 */
	static async update(
		player: Player,
		response: DraftBotPacket[],
		{missionId, count = 1, params = {}, set = false}: MissionInformations
	): Promise<Player> {

		const missionSlots = await MissionSlots.getOfPlayer(player.id);
		const missionInfo = await PlayerMissionsInfos.getOfPlayer(player.id);

		await MissionsController.handleExpiredMissions(player, missionSlots, response);
		const [completedDaily, completedCampaign] = await MissionsController.updateMissionsCounts({
			missionId,
			count,
			params,
			set
		}, missionSlots, missionInfo);
		player = await MissionsController.checkCompletedMissions(player, missionSlots, missionInfo, response, {
			completedDaily,
			completedCampaign
		});

		await player.save();
		return player;
	}

	/**
	 * Complete and update mission of a user
	 * @param player
	 * @param missionSlots
	 * @param completedDailyMission
	 * @param completedCampaign
	 */
	static async completeAndUpdateMissions(player: Player, missionSlots: MissionSlot[], completedDailyMission: boolean, completedCampaign: boolean): Promise<CompletedMission[]> {
		const completedMissions: CompletedMission[] = [];
		completedMissions.push(...await Campaign.updatePlayerCampaign(completedCampaign, player));
		for (const mission of missionSlots) {
			if (mission.isCompleted() && !mission.isCampaign()) {
				completedMissions.push({
					completedMissionType: CompletedMissionType.NORMAL,
					gems: 0, // Don't win gems in secondary missions
					missionId: mission.missionId,
					money: mission.moneyToWin,
					numberDone: mission.numberDone,
					objective: mission.missionObjective,
					points: mission.pointsToWin,
					variant: mission.missionVariant,
					xp: mission.xpToWin
				});
				draftBotInstance.logsDatabase.logMissionFinished(player.keycloakId, mission.missionId, mission.missionVariant, mission.missionObjective)
					.then();
				await mission.destroy();
			}
		}
		if (completedDailyMission) {
			const dailyMission = await DailyMissions.getOrGenerate();
			completedMissions.push({
				completedMissionType: CompletedMissionType.DAILY,
				gems: dailyMission.gemsToWin,
				missionId: dailyMission.missionId,
				money: Math.round(dailyMission.moneyToWin * Constants.MISSIONS.DAILY_MISSION_MONEY_MULTIPLIER), // Daily missions gives less money than secondary missions
				numberDone: dailyMission.objective,
				objective: dailyMission.objective,
				points: Math.round(dailyMission.pointsToWin * Constants.MISSIONS.DAILY_MISSION_POINTS_MULTIPLIER), // Daily missions give more points than secondary missions
				variant: dailyMission.variant,
				xp: dailyMission.xpToWin
			});
			draftBotInstance.logsDatabase.logMissionDailyFinished(player.keycloakId)
				.then();
		}
		await player.save();
		return completedMissions;
	}

	static async updatePlayerStats(player: Player, missionInfo: PlayerMissionsInfo, completedMissions: CompletedMission[], response: DraftBotPacket[]): Promise<Player> {
		let gemsToWin = 0;
		let xpToWin = 0;
		let pointsToWin = 0;
		let moneyToWin = 0;

		for (const completedMission of completedMissions) {
			gemsToWin += completedMission.gems;
			xpToWin += completedMission.xp;
			pointsToWin += completedMission.points;
			moneyToWin += completedMission.money;
		}

		await missionInfo.addGems(gemsToWin, player.keycloakId, NumberChangeReason.MISSION_FINISHED);

		player = await player.addExperience({
			amount: xpToWin,
			response,
			reason: NumberChangeReason.MISSION_FINISHED
		});
		player = await player.addMoney({
			amount: moneyToWin,
			response,
			reason: NumberChangeReason.MISSION_FINISHED
		});
		player = await player.addScore({
			amount: pointsToWin,
			response,
			reason: NumberChangeReason.MISSION_FINISHED
		});

		return player;
	}

	static async handleExpiredMissions(player: Player, missionSlots: MissionSlot[], response: DraftBotPacket[]): Promise<void> {
		const expiredMissions: MissionSlot[] = [];
		for (const mission of missionSlots) {
			if (mission.hasExpired()) {
				expiredMissions.push(mission);
				draftBotInstance.logsDatabase.logMissionFailed(player.keycloakId, mission.missionId, mission.missionVariant, mission.missionObjective)
					.then();
				await mission.destroy();
			}
		}
		if (expiredMissions.length === 0) {
			return;
		}

		const packet: MissionsExpiredPacket = {missions: []};
		for (const mission of expiredMissions) {
			packet.missions.push({
				missionId: mission.missionId,
				variant: mission.missionVariant,
				numberDone: mission.numberDone,
				objective: mission.missionObjective
			});
		}
		response.push(packet);
		await player.save();
	}

	public static async generateRandomDailyMissionProperties(): Promise<{
		mission: Mission,
		index: number,
		variant: number
	}> {
		const mission = MissionDataController.instance.getRandomDailyMission();
		return await this.generateMissionProperties(mission.id, MissionDifficulty.EASY, mission, true);
	}

	public static async generateMissionProperties(missionId: string, difficulty: MissionDifficulty, mission: Mission = null, daily = false, player: Player = null)
		: Promise<{
		mission: Mission,
		index: number,
		variant: number
	} | null> {
		if (!mission) {
			mission = MissionDataController.instance.getById(missionId);
			if (!mission) {
				return null;
			}
		}

		let index;
		if (!daily) {
			switch (difficulty) {
			case MissionDifficulty.EASY:
				if (!mission.canBeEasy()) {
					return null;
				}
				index = RandomUtils.draftbotRandom.pick(mission.difficulties.easy);
				break;
			case MissionDifficulty.MEDIUM:
				if (!mission.canBeMedium()) {
					return null;
				}
				index = RandomUtils.draftbotRandom.pick(mission.difficulties.medium);
				break;
			case MissionDifficulty.HARD:
				if (!mission.canBeHard()) {
					return null;
				}
				index = RandomUtils.draftbotRandom.pick(mission.difficulties.hard);
				break;
			default:
				return null;
			}
		}
		else {
			index = RandomUtils.draftbotRandom.pick(mission.dailyIndexes);
		}
		return {
			mission,
			index,
			variant: await this.getMissionInterface(mission.id)
				.generateRandomVariant(difficulty, player)
		};
	}

	public static async addMissionToPlayer(player: Player, missionId: string, difficulty: MissionDifficulty, mission: Mission = null): Promise<MissionSlot> {
		const prop = await this.generateMissionProperties(missionId, difficulty, mission, false, player);
		const missionData = MissionDataController.instance.getById(missionId);
		const missionSlot = await MissionSlot.create({
			playerId: player.id,
			missionId: prop.mission.id,
			missionVariant: prop.variant,
			missionObjective: missionData.objectives[prop.index],
			expiresAt: new Date(Date.now() + hoursToMilliseconds(missionData.expirations[prop.index])),
			numberDone: await this.getMissionInterface(missionId)
				.initialNumberDone(player, prop.variant),
			gemsToWin: missionData.gems[prop.index],
			pointsToWin: missionData.points[prop.index],
			xpToWin: missionData.xp[prop.index],
			moneyToWin: missionData.money[prop.index]
		});
		const retMission = await MissionSlots.getById(missionSlot.id);
		draftBotInstance.logsDatabase.logMissionFound(player.keycloakId, retMission.missionId, retMission.missionVariant, retMission.missionObjective)
			.then();
		return retMission;
	}

	public static async addRandomMissionToPlayer(player: Player, difficulty: MissionDifficulty): Promise<MissionSlot> {
		const mission = MissionDataController.instance.getRandomMission(difficulty);
		return await MissionsController.addMissionToPlayer(player, mission.id, difficulty, mission);
	}

	public static getRandomDifficulty(player: Player): MissionDifficulty {
		for (let i = Constants.MISSIONS.SLOTS_LEVEL_PROBABILITIES.length - 1; i >= 0; i--) {
			const probability = Constants.MISSIONS.SLOTS_LEVEL_PROBABILITIES[i];
			if (player.level >= probability.LEVEL) {
				const randomNumber = RandomUtils.draftbotRandom.realZeroToOneInclusive();
				return randomNumber < probability.EASY ? MissionDifficulty.EASY : randomNumber < probability.MEDIUM + probability.EASY ? MissionDifficulty.MEDIUM : MissionDifficulty.HARD;
			}
		}

		return MissionDifficulty.EASY;
	}

	/**
	 * Update the counts of the different mission the user has
	 * @param missionInformation
	 * @param missionSlots
	 * @param missionInfo
	 * @private
	 * @return true if the daily mission is finished and needs to be said to the player
	 */
	private static async updateMissionsCounts(missionInformation: MissionInformations, missionSlots: MissionSlot[], missionInfo: PlayerMissionsInfo): Promise<boolean[]> {
		const missionInterface = this.getMissionInterface(missionInformation.missionId);
		const completedCampaign = await this.checkMissionSlots(missionInterface, missionInformation, missionSlots);
		if (missionInfo.hasCompletedDailyMission()) {
			return [false, completedCampaign];
		}
		const dailyMission = await DailyMissions.getOrGenerate();
		if (dailyMission.missionId !== missionInformation.missionId) {
			return [false, completedCampaign];
		}
		if (!missionInterface.areParamsMatchingVariantAndSave(dailyMission.variant, missionInformation.params, null)) {
			return [false, completedCampaign];
		}
		missionInfo.dailyMissionNumberDone += missionInformation.count;
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
	 * Updates the missions located in the mission slots of the player
	 * @param missionInterface
	 * @param missionInformations
	 * @param missionSlots
	 * @private
	 */
	private static async checkMissionSlots(missionInterface: IMission, missionInformations: MissionInformations, missionSlots: MissionSlot[]): Promise<boolean> {
		let completedCampaign = false;
		for (const mission of missionSlots.filter((missionSlot) => missionSlot.missionId === missionInformations.missionId)) {
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