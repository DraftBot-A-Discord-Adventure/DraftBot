import {DraftBotPacket, PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordMQTT} from "../bot/DiscordMQTT";
import {MqttConstants} from "../../../Lib/src/constants/MqttConstants";

export abstract class PacketUtils {
	static sendPacketToBackend(context: PacketContext, packet: DraftBotPacket): void {
		DiscordMQTT.mqttClient!.publish(MqttConstants.CORE_TOPIC, JSON.stringify({
			packet: {
				name: packet.constructor.name,
				data: packet
			},
			context
		}));
	}
}