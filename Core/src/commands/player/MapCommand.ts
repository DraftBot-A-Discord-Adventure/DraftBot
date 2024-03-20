import {packetHandler} from "../../core/packetHandlers/PacketHandler";
import {CommandMapDisplayRes, CommandMapPacketReq} from "../../../../Lib/src/packets/commands/CommandMapPacket";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {WebsocketClient} from "../../../../Lib/src/instances/WebsocketClient";
import {Player, Players} from "../../core/database/game/models/Player";
import {MapLocation} from "../../data/MapLocation";
import {Language} from "../../../../Lib/src/Language";
import {MapLinkDataController} from "../../data/MapLink";

async function getMapInformation(player: Player, destination: MapLocation, isInEvent: boolean, language: Language): Promise<{
	name: string,
	forced: boolean
}> {
	const mapLink = MapLinkDataController.instance.getById(destination.id);

	if (!isInEvent && mapLink.forcedImage) {
		return {
			name: mapLink.forcedImage,
			forced: true
		};
	}

	const departure = player.getPreviousMap();

	if (isInEvent) {
		return {
			name: mapLink.forcedImage ?? `${language}_${destination.id}_`,
			forced: Boolean(destination.forcedImage)
		};
	}

	if (destination.id < departure.id) {
		return {
			name: `${language}_${destination.id}_${departure.id}_`,
			forced: false
		};
	}

	return {
		name: `${language}_${departure.id}_${destination.id}_`,
		forced: false
	};
}

export class MapCommand {
	@packetHandler(CommandMapPacketReq)
	async execute(client: WebsocketClient, packet: CommandMapPacketReq, context: PacketContext, response: DraftBotPacket[]): Promise<void> {
		const player = await Players.getByKeycloakId(packet.keycloakId);

		if (!player) {
			response.push(makePacket(CommandMapDisplayRes, {
				foundPlayer: false
			}));
		}
		else {
			const isInEvent = player.isInEvent();
			const destinationMap = player.getDestination();

			const mapInformation = await getMapInformation(player, destinationMap, isInEvent, packet.language);

			response.push(makePacket(CommandMapDisplayRes, {
				foundPlayer: true,
				keycloakId: player.keycloakId,
				data: {
					mapId: destinationMap.id,
					mapLink: mapInformation,
					mapType: destinationMap.type,
					inEvent: isInEvent
				}
			}));
		}
	}
}