import Player from "../database/game/models/Player";
import { IMission } from "./IMission";
import MissionSlot, { MissionSlots } from "../database/game/models/MissionSlot";
import { DailyMissions } from "../database/game/models/DailyMission";
import { hoursToMilliseconds } from "../../../../Lib/src/utils/TimeUtils";
import { MissionDifficulty } from "./MissionDifficulty";
import { Campaign } from "./Campaign";
import { Constants } from "../../../../Lib/src/constants/Constants";
import { RandomUtils } from "../../../../Lib/src/utils/RandomUtils";
import { NumberChangeReason } from "../../../../Lib/src/constants/LogsConstants";
import PlayerMissionsInfo, { PlayerMissionsInfos } from "../database/game/models/PlayerMissionsInfo";
import {
	CrowniclesPacket, makePacket
} from "../../../../Lib/src/packets/CrowniclesPacket";
import { MissionsExpiredPacket } from "../../../../Lib/src/packets/events/MissionsExpiredPacket";
import { crowniclesInstance } from "../../index";
import {
	Mission, MissionDataController
} from "../../data/Mission";
import { MissionsCompletedPacket } from "../../../../Lib/src/packets/events/MissionsCompletedPacket";
import {
	BaseMission, CompletedMission, MissionType
} from "../../../../Lib/src/types/CompletedMission";
import { FightActionController } from "../fights/actions/FightActionController";
import { MissionUtils } from "../../../../Lib/src/utils/MissionUtils";
import { MapLocationDataController } from "../../data/MapLocation";

type MissionInformations = {
	missionId: string;
	count?: number;
	params?: {
		[key: string]: unknown;
	};
	set?: boolean;
};

export type GeneratedMission = {
	mission: Mission;
	index: number;
	variant: number;
};

type GenerateMissionPropertiesOptions = {
	mission?: Mission;
	daily?: boolean;
	player?: Player;
};

type SpecialMissionCompletion = {
	daily: boolean;
	campaign: boolean;
};

export class MissionsController {
	static getMissionInterface(missionId: string): IMission {
		try {
			return (require(`./interfaces/${missionId}`) as {
				missionInterface: IMission;
			}).missionInterface;
		}
		catch {
			// Forced to use a require, as importing the base interface directly will result in a cyclic import (DefaultInterface -> IMission -> Player -> MissionController)
			return require("./DefaultInterface").missionInterface;
		}
	}

	/**
	 * Check and update the completed missions of the Player
	 * @param player
	 * @param missionSlots
	 * @param missionInfo
	 * @param response the response packets
	 * @param specialMissionCompletion
	 */
	static async checkCompletedMissions(
		player: Player,
		missionSlots: MissionSlot[],
		missionInfo: PlayerMissionsInfo,
		response: CrowniclesPacket[],
		specialMissionCompletion: SpecialMissionCompletion = {
			daily: false,
			campaign: false
		}
	): Promise<Player> {
		const completedMissions = await MissionsController.completeAndUpdateMissions(player, missionSlots, specialMissionCompletion);
		if (completedMissions.length !== 0) {
			player = await MissionsController.updatePlayerStats(player, missionInfo, completedMissions, response);
			response.push(makePacket(MissionsCompletedPacket, {
				missions: MissionsController.prepareBaseMissions(completedMissions),
				keycloakId: player.keycloakId
			}));
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
		response: CrowniclesPacket[],
		{
			missionId,
			count = 1,
			params = {},
			set = false
		}: MissionInformations
	): Promise<Player> {
		const missionSlots = await MissionSlots.getOfPlayer(player.id);
		const missionInfo = await PlayerMissionsInfos.getOfPlayer(player.id);

		await MissionsController.handleExpiredMissions(player, missionSlots, response);
		const specialMissionCompletion = await MissionsController.updateMissionsCounts({
			missionId,
			count,
			params,
			set
		}, missionSlots, missionInfo);
		player = await MissionsController.checkCompletedMissions(player, missionSlots, missionInfo, response, specialMissionCompletion);

		await player.save();
		return player;
	}

	/**
	 * Complete and update the missions of a user
	 * @param player
	 * @param missionSlots
	 * @param specialMissionCompletion
	 */
	static async completeAndUpdateMissions(player: Player, missionSlots: MissionSlot[], specialMissionCompletion: SpecialMissionCompletion): Promise<CompletedMission[]> {
		const completedMissions: CompletedMission[] = [];
		completedMissions.push(...await Campaign.updatePlayerCampaign(specialMissionCompletion.campaign, player));
		for (const mission of missionSlots.filter(mission => mission.isCompleted() && !mission.isCampaign())) {
			completedMissions.push({
				missionType: MissionType.NORMAL,
				...mission.toJSON(),
				gemsToWin: 0 // Don't win gems in secondary missions
			});
			crowniclesInstance.logsDatabase.logMissionFinished(player.keycloakId, mission.missionId, mission.missionVariant, mission.missionObjective)
				.then();
			await mission.destroy();
		}
		if (specialMissionCompletion.daily) {
			const dailyMission = await DailyMissions.getOrGenerate();
			completedMissions.push({
				missionType: MissionType.DAILY,
				...dailyMission.toJSON(),
				moneyToWin: Math.round(dailyMission.moneyToWin * Constants.MISSIONS.DAILY_MISSION_MONEY_MULTIPLIER), // Daily missions gives less money than secondary missions
				pointsToWin: Math.round(dailyMission.pointsToWin * Constants.MISSIONS.DAILY_MISSION_POINTS_MULTIPLIER) // Daily missions give more points than secondary missions
			});
			crowniclesInstance.logsDatabase.logMissionDailyFinished(player.keycloakId)
				.then();
		}
		await player.save();
		return completedMissions;
	}

	static async updatePlayerStats(player: Player, missionInfo: PlayerMissionsInfo, completedMissions: CompletedMission[], response: CrowniclesPacket[]): Promise<Player> {
		// Totalizer function to sum the values of the completed missions
		const totalizer = (mapper: (m: CompletedMission) => number): number => completedMissions.map(mapper)
			.reduce((a, b) => a + b);

		await missionInfo.addGems(totalizer(m => m.gemsToWin), player.keycloakId, NumberChangeReason.MISSION_FINISHED);

		player = await player.addExperience({
			amount: totalizer(m => m.xpToWin),
			response,
			reason: NumberChangeReason.MISSION_FINISHED
		});
		player = await player.addMoney({
			amount: totalizer(m => m.moneyToWin),
			response,
			reason: NumberChangeReason.MISSION_FINISHED
		});
		player = await player.addScore({
			amount: totalizer(m => m.pointsToWin),
			response,
			reason: NumberChangeReason.MISSION_FINISHED
		});

		return player;
	}

	static async handleExpiredMissions(player: Player, missionSlots: MissionSlot[], response: CrowniclesPacket[]): Promise<void> {
		const expiredMissions: MissionSlot[] = [];
		for (const mission of missionSlots) {
			if (mission.hasExpired()) {
				expiredMissions.push(mission);
				crowniclesInstance.logsDatabase.logMissionFailed(player.keycloakId, mission.missionId, mission.missionVariant, mission.missionObjective)
					.then();
				await mission.destroy();
			}
		}
		if (expiredMissions.length === 0) {
			return;
		}

		response.push(makePacket(MissionsExpiredPacket, {
			missions: MissionsController.prepareMissionSlots(expiredMissions),
			keycloakId: player.keycloakId
		}));
		await player.save();
	}

	/**
	 * Prepare a mission to be sent to the front-end
	 * @param mission
	 */
	public static prepareMissionSlot(mission: MissionSlot): BaseMission {
		return this.prepareBaseMission(mission.toBaseMission());
	}

	public static prepareBaseMissions(missions: BaseMission[]): BaseMission[] {
		return missions.map(mission => this.prepareBaseMission(mission));
	}

	public static prepareBaseMission(baseMission: BaseMission): BaseMission {
		if (baseMission.expiresAt) {
			baseMission.expiresAt = new Date(baseMission.expiresAt).toString();
		}
		if (MissionUtils.isRequiredFightActionId(baseMission)) {
			baseMission.fightAction = FightActionController.variantToFightActionId(baseMission.missionVariant);
		}
		if (MissionUtils.isRequiredMapLocationMapType(baseMission)) {
			baseMission.mapType = MapLocationDataController.instance.getById(baseMission.missionVariant).type;
		}
		return baseMission;
	}

	/**
	 * Prepare the missions to be sent to the front-end
	 * @param missionSlots
	 */
	public static prepareMissionSlots(missionSlots: MissionSlot[]): BaseMission[] {
		return missionSlots.map(mission => MissionsController.prepareMissionSlot(mission));
	}

	public static generateRandomDailyMissionProperties(): GeneratedMission {
		const mission = MissionDataController.instance.getRandomDailyMission();
		return this.generateMissionProperties(mission.id, MissionDifficulty.EASY, {
			mission,
			daily: true
		});
	}

	public static generateMissionProperties(missionId: string, difficulty: MissionDifficulty, {
		mission = null,
		daily = false,
		player = null
	}: GenerateMissionPropertiesOptions): GeneratedMission {
		if (!mission) {
			mission = MissionDataController.instance.getById(missionId);
			if (!mission) {
				return null;
			}
		}
		const generatedMission = {
			mission,
			index: this.generateMissionIndex(mission, difficulty),
			variant: this.getMissionInterface(mission.id)
				.generateRandomVariant(difficulty, player)
		};
		if (!daily) {
			return generatedMission.index === null ? null : generatedMission;
		}
		generatedMission.index = RandomUtils.crowniclesRandom.pick(mission.dailyIndexes);
		return generatedMission;
	}

	public static async addMissionToPlayer(player: Player, missionId: string, difficulty: MissionDifficulty, mission: Mission = null): Promise<MissionSlot> {
		const prop = this.generateMissionProperties(missionId, difficulty, {
			mission,
			daily: false,
			player
		});
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
		crowniclesInstance.logsDatabase.logMissionFound(player.keycloakId, retMission.missionId, retMission.missionVariant, retMission.missionObjective)
			.then();
		return retMission;
	}

	public static async addRandomMissionToPlayer(player: Player, difficulty: MissionDifficulty, exception = ""): Promise<MissionSlot> {
		const mission = MissionDataController.instance.getRandomMission(difficulty, exception);
		return await MissionsController.addMissionToPlayer(player, mission.id, difficulty, mission);
	}

	public static getRandomDifficulty(player: Player): MissionDifficulty {
		for (let i = Constants.MISSIONS.SLOTS_LEVEL_PROBABILITIES.length - 1; i >= 0; i--) {
			const probability = Constants.MISSIONS.SLOTS_LEVEL_PROBABILITIES[i];
			if (player.level >= probability.LEVEL) {
				const randomNumber = RandomUtils.crowniclesRandom.realZeroToOneInclusive();
				return randomNumber < probability.EASY
					? MissionDifficulty.EASY
					: randomNumber < probability.MEDIUM + probability.EASY
						? MissionDifficulty.MEDIUM
						: MissionDifficulty.HARD;
			}
		}

		return MissionDifficulty.EASY;
	}

	private static generateMissionIndex(mission: Mission, difficulty: MissionDifficulty): number {
		if (difficulty === MissionDifficulty.EASY && mission.canBeEasy()) {
			return RandomUtils.crowniclesRandom.pick(mission.difficulties.easy);
		}
		if (difficulty === MissionDifficulty.MEDIUM && mission.canBeMedium()) {
			return RandomUtils.crowniclesRandom.pick(mission.difficulties.medium);
		}
		if (difficulty === MissionDifficulty.HARD && mission.canBeHard()) {
			return RandomUtils.crowniclesRandom.pick(mission.difficulties.hard);
		}
		return null;
	}

	/**
	 * Update the counts of the different mission the user has
	 * @param missionInformation
	 * @param missionSlots
	 * @param missionInfo
	 * @returns true if the daily mission is finished and needs to be said to the player
	 */
	private static async updateMissionsCounts(missionInformation: MissionInformations, missionSlots: MissionSlot[], missionInfo: PlayerMissionsInfo): Promise<SpecialMissionCompletion> {
		const missionInterface = this.getMissionInterface(missionInformation.missionId);
		const specialMissionCompletion: SpecialMissionCompletion = {
			daily: false,
			campaign: await this.checkMissionSlots(missionInterface, missionInformation, missionSlots)
		};
		if (missionInfo.hasCompletedDailyMission()) {
			return specialMissionCompletion;
		}
		const dailyMission = await DailyMissions.getOrGenerate();
		if (dailyMission.missionId !== missionInformation.missionId
			|| !missionInterface.areParamsMatchingVariantAndBlob(dailyMission.missionVariant, missionInformation.params, null)) {
			return specialMissionCompletion;
		}
		missionInfo.dailyMissionNumberDone += missionInformation.count;
		if (missionInfo.dailyMissionNumberDone > dailyMission.missionObjective) {
			missionInfo.dailyMissionNumberDone = dailyMission.missionObjective;
		}
		await missionInfo.save();
		if (missionInfo.dailyMissionNumberDone >= dailyMission.missionObjective) {
			missionInfo.lastDailyMissionCompleted = new Date();
			await missionInfo.save();
			specialMissionCompletion.daily = true;
			return specialMissionCompletion;
		}
		return specialMissionCompletion;
	}

	/**
	 * Updates the missions located in the mission slots of the player
	 * @param missionInterface
	 * @param missionInformations
	 * @param missionSlots
	 */
	private static async checkMissionSlots(missionInterface: IMission, missionInformations: MissionInformations, missionSlots: MissionSlot[]): Promise<boolean> {
		let completedCampaign = false;
		for (const mission of missionSlots.filter(missionSlot => missionSlot.missionId === missionInformations.missionId)) {
			if (missionInterface.areParamsMatchingVariantAndBlob(mission.missionVariant, missionInformations.params, mission.saveBlob)
				&& !mission.hasExpired() && !mission.isCompleted()
			) {
				await this.updateMission(mission, missionInformations);
				completedCampaign = completedCampaign || mission.isCampaign() && mission.isCompleted();
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
	 */
	private static async updateBlob(missionInterface: IMission, mission: MissionSlot, missionInformations: MissionInformations): Promise<void> {
		const saveBlob = missionInterface.updateSaveBlob(mission.missionVariant, mission.saveBlob, missionInformations.params);
		if (saveBlob !== mission.saveBlob) {
			mission.saveBlob = saveBlob;
			await mission.save();
		}
	}

	/**
	 * Updates the progression of the mission
	 * @param mission
	 * @param missionInformations
	 */
	private static async updateMission(mission: MissionSlot, missionInformations: MissionInformations): Promise<void> {
		mission.numberDone = Math.min(mission.missionObjective, missionInformations.set ? missionInformations.count : mission.numberDone + missionInformations.count);
		await mission.save();
	}
}
