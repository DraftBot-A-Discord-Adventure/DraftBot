import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Player, Players} from "../../core/database/game/models/Player";
import {
	CommandMissionPlayerNotFoundPacket,
	CommandMissionsPacketReq,
	CommandMissionsPacketRes
} from "../../../../Lib/src/packets/commands/CommandMissionsPacket";
import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {MissionSlots} from "../../core/database/game/models/MissionSlot";
import {PlayerMissionsInfos} from "../../core/database/game/models/PlayerMissionsInfo";
import {BaseMission, MissionType} from "../../../../Lib/src/interfaces/CompletedMission";
import {DailyMissions} from "../../core/database/game/models/DailyMission";
import {Campaign} from "../../core/missions/Campaign";
import {MissionsController} from "../../core/missions/MissionsController";

export default class MissionsCommand {
	@commandRequires(CommandMissionsPacketReq, {
		notBlocked: false,
		disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.NOT_STARTED_OR_DEAD
	})
	async execute(response: DraftBotPacket[], player: Player, packet: CommandMissionsPacketReq, context: PacketContext): Promise<void> {
		const toCheckPlayer = packet.askedPlayer.keycloakId
			? packet.askedPlayer.keycloakId === context.keycloakId
				? player
				: await Players.getByKeycloakId(packet.askedPlayer.keycloakId)
			: await Players.getByRank(packet.askedPlayer.rank);

		if (!toCheckPlayer) {
			response.push(makePacket(CommandMissionPlayerNotFoundPacket, {}));
			return;
		}

		if (toCheckPlayer.id === player.id) {
			await MissionsController.update(player, response, {missionId: "commandMission"});
		}

		const missionSlots = await MissionSlots.getOfPlayer(toCheckPlayer.id);

		// Loading secondary missions and campaign
		const missions: BaseMission[] = missionSlots.map((missionSlot): BaseMission => ({
			...missionSlot.toJSON(),
			missionType: missionSlot.expiresAt ? MissionType.NORMAL : MissionType.CAMPAIGN
		}));

		const missionInfo = await PlayerMissionsInfos.getOfPlayer(toCheckPlayer.id);
		// Loading daily mission
		missions.push({
			...(await DailyMissions.getOrGenerate()).toJSON(),
			// We are using the expiresAt field to store the last time the daily mission was completed,
			// And the front-end will use the data to calculate the time left to complete it
			expiresAt: new Date(missionInfo.lastDailyMissionCompleted).toString(),
			missionType: MissionType.DAILY,
			numberDone: missionInfo.dailyMissionNumberDone
		});

		response.push(makePacket(CommandMissionsPacketRes, {
			keycloakId: toCheckPlayer.keycloakId,
			missions: MissionsController.prepareBaseMissions(missions),
			maxCampaignNumber: Campaign.getMaxCampaignNumber(),
			campaignProgression: missionInfo.campaignProgression,
			maxSideMissionSlots: toCheckPlayer.getMissionSlotsNumber()
		}));
	}
}