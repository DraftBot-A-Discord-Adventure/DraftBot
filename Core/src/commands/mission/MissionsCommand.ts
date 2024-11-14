import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Players} from "../../core/database/game/models/Player";
import {
	CommandMissionPlayerNotFoundPacket,
	CommandMissionsPacketReq,
	CommandMissionsPacketRes
} from "../../../../Lib/src/packets/commands/CommandMissionsPacket";
import {CommandUtils} from "../../core/utils/CommandUtils";
import {MissionSlots} from "../../core/database/game/models/MissionSlot";
import {PlayerMissionsInfos} from "../../core/database/game/models/PlayerMissionsInfo";
import {BaseMission, MissionType} from "../../../../Lib/src/interfaces/CompletedMission";
import {DailyMissions} from "../../core/database/game/models/DailyMission";
import {Campaign} from "../../core/missions/Campaign";

export default class MissionsCommand {
	@packetHandler(CommandMissionsPacketReq)
	async execute(packet: CommandMissionsPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const initiator = await Players.getByKeycloakId(context.keycloakId);
		if (!await CommandUtils.verifyStartedAndNotDead(initiator, response)) {
			return; // TODO: check si c'est pas censé être géré par les commands requirements ???
		}

		const player = packet.askedPlayer.keycloakId
			? packet.askedPlayer.keycloakId === context.keycloakId
				? initiator
				: await Players.getByKeycloakId(packet.askedPlayer.keycloakId)
			: await Players.getByRank(packet.askedPlayer.rank);

		if (!player) {
			response.push(makePacket(CommandMissionPlayerNotFoundPacket, {}));
			return;
		}

		const missionSlots = await MissionSlots.getOfPlayer(player.id);

		// Loading secondary missions and campaign
		const missions: BaseMission[] = missionSlots.map((missionSlot): BaseMission => ({
			...missionSlot.toJSON(),
			missionType: missionSlot.expiresAt ? MissionType.NORMAL : MissionType.CAMPAIGN
		}));

		const missionInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
		// Loading daily mission
		missions.push({
			...(await DailyMissions.getOrGenerate()).toJSON(),
			// We are using the expireAt field to store the last time the daily mission was completed,
			// And the front-end will use the data to calculate the time left to complete it
			expireAt: missionInfo.lastDailyMissionCompleted,
			missionType: MissionType.DAILY,
			numberDone: missionInfo.dailyMissionNumberDone
		});

		response.push(makePacket(CommandMissionsPacketRes, {
			keycloakId: player.keycloakId,
			missions,
			maxCampaignNumber: Campaign.getMaxCampaignNumber(),
			campaignProgression: missionInfo.campaignProgression,
			maxSideMissionSlots: player.getMissionSlotsNumber()
		}));
	}
}