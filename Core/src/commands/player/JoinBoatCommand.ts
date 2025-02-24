import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import Player from "../../core/database/game/models/Player";
import {
	CommandJoinBoatNoGuildPacketRes, CommandJoinBoatNoMemberOnBoatPacketRes, CommandJoinBoatNotEnoughEnergyPacketRes,
	CommandJoinBoatPacketReq, CommandJoinBoatTooManyRunsPacketRes
} from "../../../../Lib/src/packets/commands/CommandJoinBoatPacket";
import {PVEConstants} from "../../../../Lib/src/constants/PVEConstants";
import {Guilds} from "../../core/database/game/models/Guild";
import {LogsReadRequests} from "../../core/database/logs/LogsReadRequests";
import {Maps} from "../../core/maps/Maps";
import {MissionsController} from "../../core/missions/MissionsController";


async function acceptJoinBoat(player: Player, response: DraftBotPacket[]): Promise<void> {
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
	const price = await player.getTravelCostThisWeek();
	// TODO : Mettre le player sur le bateau
	// TODO : Dépenser les gemmes
	await MissionsController.update(player, response,  {missionId: "joinMemberOnBoat"});
	return;

}



export default class JoinBoatCommand {
	@commandRequires(CommandJoinBoatPacketReq, {
		notBlocked: true,
		disallowedEffects: CommandUtils.DISALLOWED_EFFECTS.NOT_STARTED_OR_DEAD,
		level: PVEConstants.MIN_LEVEL,
		guildNeeded: true,
	})
	async execute(response: DraftBotPacket[], player: Player, packet: CommandJoinBoatPacketReq, context: PacketContext): Promise<void> {