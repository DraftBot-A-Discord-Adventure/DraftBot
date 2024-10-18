import {discordConfig} from "./DraftBotShard";
import {PacketListenerClient} from "../../../Lib/src/packets/PacketListener";
import {registerAllPacketHandlers} from "../packetHandlers/PacketHandler";
import {makePacket} from "../../../Lib/src/packets/DraftBotPacket";
import {ErrorPacket} from "../../../Lib/src/packets/commands/ErrorPacket";
import {connect, MqttClient} from "mqtt";

export class DiscordMQTT {
	static mqttClient: MqttClient;

	static packetListener: PacketListenerClient = new PacketListenerClient();

	static async init(): Promise<void> {
		// Register packets
		await registerAllPacketHandlers();

		DiscordMQTT.mqttClient = connect(discordConfig.MQTT_HOST);

		DiscordMQTT.mqttClient.on("connect", () => {
			DiscordMQTT.mqttClient.subscribe("draftbot_discord", (err) => {
				if (err) {
					console.error(err);
				}
				else {
					console.log("Connected to MQTT");
				}
			});
		});

		DiscordMQTT.mqttClient.on("message", async (topic, message) => {
			// todo ignore if not the right shard
			const messageString = message.toString();
			console.log(`Received message from topic ${topic}: ${messageString}`);
			const dataJson = JSON.parse(messageString);
			if (!Object.hasOwn(dataJson, "packets") || !Object.hasOwn(dataJson, "context")) {
				console.log(`Wrong packet format : ${messageString}`);
				return;
			}
			for (const packet of dataJson.packets) {
				let listener = DiscordMQTT.packetListener.getListener(packet.name);
				if (!listener) {
					packet.packet = makePacket(ErrorPacket, { message: `No packet listener found for received packet '${packet.name}'.\n\nData:\n${JSON.stringify(packet.packet)}` });
					listener = DiscordMQTT.packetListener.getListener("ErrorPacket")!;
				}
				await listener(packet.packet, dataJson.context);
			}
		});
	}
}

