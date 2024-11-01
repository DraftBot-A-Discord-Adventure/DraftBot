import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {Players} from "../../core/database/game/models/Player";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {RespawnConstants} from "../../../../Lib/src/constants/RespawnConstants";
import {NumberChangeReason} from "../../../../Lib/src/constants/LogsConstants";
import {Maps} from "../../core/maps/Maps";
import {MapLinkDataController} from "../../data/MapLink";
import {TravelTime} from "../../core/maps/TravelTime";
import {PlayerSmallEvents} from "../../core/database/game/models/PlayerSmallEvent";
import {
	CommandRespawnErrorAlreadyAlive,
	CommandRespawnPacketReq,
	CommandRespawnPacketRes
} from "../../../../Lib/src/packets/commands/CommandRespawnPacket";

export default class RespawnCommand {

	/**
	 * Respawn the player
	 * @param _packet
	 * @param context
	 * @param response
	 */
	@packetHandler(CommandRespawnPacketReq)
	async execute(_packet: CommandRespawnPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const player = await Players.getByKeycloakId(context.keycloakId);
		if (BlockingUtils.appendBlockedPacket(player, response)) {
			return;
		}
		if (player.effectId !== Effect.DEAD.id) {
			response.push(makePacket(CommandRespawnErrorAlreadyAlive, {}));
			return;
		}
		const lostScore = Math.round(player.score * RespawnConstants.SCORE_REMOVAL_MULTIPLIER);
		await player.addHealth(player.getMaxHealth() - player.health, response, NumberChangeReason.RESPAWN, {
			shouldPokeMission: false,
			overHealCountsForMission: false
		});
		await player.addScore({
			amount: -lostScore,
			response,
			reason: NumberChangeReason.RESPAWN
		});
		await player.setRage(0, NumberChangeReason.RESPAWN); // Remove rage in case the player died while in the pve island

		await player.save();

		await Maps.stopTravel(player);
		const newlink = MapLinkDataController.instance.getLinkByLocations(
			player.getPreviousMapId(),
			player.getDestinationId()
		);

		await TravelTime.removeEffect(player, NumberChangeReason.RESPAWN);
		await Maps.startTravel(player, newlink, Date.now());

		await PlayerSmallEvents.removeSmallEventsOfPlayer(player.id);
		response.push(makePacket(CommandRespawnPacketRes, {lostScore}));
	}
}

