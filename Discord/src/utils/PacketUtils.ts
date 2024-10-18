import {DraftBotPacket, PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordMQTT} from "../bot/Websocket";

export abstract class PacketUtils {
	static sendPacketToBackend(context: PacketContext, packet: DraftBotPacket): void {
		DiscordMQTT.mqttClient!.publish("draftbot_core", JSON.stringify({
			packet: {
				name: packet.constructor.name,
				data: packet
			},
			context
		}));
	}
}