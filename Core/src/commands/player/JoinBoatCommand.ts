import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import Player from "../../core/database/game/models/Player";
import {
	CommandJoinBoatAcceptPacketRes,
	CommandJoinBoatNoGuildPacketRes, CommandJoinBoatNoMemberOnBoatPacketRes, CommandJoinBoatNotEnoughEnergyPacketRes,
	CommandJoinBoatPacketReq, CommandJoinBoatRefusePacketRes, CommandJoinBoatTooManyRunsPacketRes
} from "../../../../Lib/src/packets/commands/CommandJoinBoatPacket";
import {PVEConstants} from "../../../../Lib/src/constants/PVEConstants";
import {LogsReadRequests} from "../../core/database/logs/LogsReadRequests";
import {Maps} from "../../core/maps/Maps";
import {MissionsController} from "../../core/missions/MissionsController";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {ReactionCollectorJoinBoat} from "../../../../Lib/src/packets/interaction/ReactionCollectorJoinBoat";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {BlockingUtils} from "../../core/utils/BlockingUtils";


async function acceptJoinBoat(player: Player, response: DraftBotPacket[]): Promise<void> {
	await player.reload();
	// Check if the player is still part of a guild
	if (!player.guildId) {
		response.push(makePacket(CommandJoinBoatNoGuildPacketRes, {}));
		return;
	}
	// The player has been on the island too often this week
	if (await LogsReadRequests.getCountPVEIslandThisWeek(player.keycloakId, player.guildId) >= PVEConstants.TRAVEL_COST.length) {
		response.push(makePacket(CommandJoinBoatTooManyRunsPacketRes, {}));
		return;
	}
	// No guild members on the boat
	const guildOnBoat = await Maps.getGuildMembersOnBoat(player);
	if (guildOnBoat.length === 0) {
		response.push(makePacket(CommandJoinBoatNoMemberOnBoatPacketRes, {}));
		return;
	}
	// The player doesn't have enough energy
	if (!player.hasEnoughEnergyToJoinTheIsland()) {
		response.push(makePacket(CommandJoinBoatNotEnoughEnergyPacketRes, {}));
		return;
	}
	const anotherMemberOnBoat = guildOnBoat;
	const price = await player.getTravelCostThisWeek();
	await Maps.startBoatTravel(player, price, anotherMemberOnBoat[0], Date.now(),NumberChangeReason.PVE_ISLAND, response);
	await MissionsController.update(player, response, {missionId: "joinMemberOnBoat"});
}

function endCallback(player: Player): EndCallback {
	return async (collector, response): Promise<void> => {
		const reaction = collector.getFirstReaction();
		if (reaction && reaction.reaction.type === ReactionCollectorAcceptReaction.name) {
			await acceptJoinBoat(player, response);
			response.push(makePacket(CommandJoinBoatAcceptPacketRes, {}));
		}
		else {
			response.push(makePacket(CommandJoinBoatRefusePacketRes, {}));
		}
		BlockingUtils.unblockPlayer(player.id, BlockingConstants.REASONS.PVE_ISLAND);
	};
}

export default class JoinBoatCommand {
	@commandRequires(CommandJoinBoatPacketReq, {
		notBlocked: true,
		allowedEffects: CommandUtils.ALLOWED_EFFECTS.NO_EFFECT,
		level: PVEConstants.MIN_LEVEL,
		guildNeeded: true
	})
	async execute(response: DraftBotPacket[], player: Player, _packet: CommandJoinBoatPacketReq, context: PacketContext): Promise<void> {
		const price = await player.getTravelCostThisWeek();

		const collector = new ReactionCollectorJoinBoat(
			price,
			player.getCumulativeFightPoint(),
			player.getMaxCumulativeFightPoint()
		);

		const collectorPacket = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerKeycloakIds: [player.keycloakId],
				reactionLimit: 1
			},
			endCallback(player)
		)
			.block(player.id, BlockingConstants.REASONS.PVE_ISLAND)
			.build();

		response.push(collectorPacket);
	}
}
