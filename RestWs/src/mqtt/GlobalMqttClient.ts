import { MqttTopicUtils } from "../../../Lib/src/utils/MqttTopicUtils";
import { restWsConfig } from "../index";
import { RestWsMqttClient } from "./RestWsMqttClient";
import { DraftBotLogger } from "../../../Lib/src/logs/DraftBotLogger";
import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { WebSocketServer } from "../services/WebSocketServer";

export class GlobalMqttClient extends RestWsMqttClient {
	private readonly coreTopic = MqttTopicUtils.getCoreTopic(restWsConfig.PREFIX);

	onConnect(): void {
		this.subscribeTo(this.mqttClient, MqttTopicUtils.getWebSocketTopic(restWsConfig.PREFIX), true);
	}

	onMessage(message: string): void {
		const dataJson = JSON.parse(message);
		DraftBotLogger.debug("Received global message", { packet: dataJson });

		if (!Object.hasOwn(dataJson, "packets") || !Object.hasOwn(dataJson, "context")) {
			DraftBotLogger.error("Wrong packet format", { packet: message });
		}

		const context = dataJson.context as PacketContext;

		WebSocketServer.dispatchPacketsToClient(context.keycloakId!, dataJson.packets);
	}

	public sendToBackEnd(context: PacketContext, packet: any): void {
		const toSend = {
			packet,
			context
		};
		this.mqttClient.publish(this.coreTopic, JSON.stringify(toSend));
		DraftBotLogger.debug("Sent message to backend", toSend);
	}
}
