import {discordConfig} from "./DraftBotShard";
import {PacketListenerClient} from "../../../Lib/src/packets/PacketListener";
import {registerAllPacketHandlers} from "../packetHandlers/PacketHandler";
import {makePacket} from "../../../Lib/src/packets/DraftBotPacket";
import {ErrorPacket} from "../../../Lib/src/packets/commands/ErrorPacket";
import {connect, MqttClient} from "mqtt";
import {MqttConstants} from "../../../Lib/src/constants/MqttConstants";
import {DiscordAnnouncement} from "../announcements/DiscordAnnouncement";

export class DiscordMQTT {
	static mqttClient: MqttClient;

	static packetListener: PacketListenerClient = new PacketListenerClient();

	static async init(): Promise<void> {
		// Register packets
		await registerAllPacketHandlers();

		DiscordMQTT.mqttClient = connect(discordConfig.MQTT_HOST);

		DiscordMQTT.mqttClient.on("connect", () => {
			// eslint-disable-next-line no-confusing-arrow
			DiscordMQTT.mqttClient.subscribe(MqttConstants.DISCORD_TOPIC, err =>
				err ? console.error(err) : console.log(`Subscribed to topic ${MqttConstants.DISCORD_TOPIC}`));
			// eslint-disable-next-line no-confusing-arrow
			DiscordMQTT.mqttClient.subscribe(MqttConstants.DISCORD_TOP_WEEK_ANNOUNCEMENT_TOPIC, err =>
				err ? console.error(err) : console.log(`Subscribed to topic ${MqttConstants.DISCORD_TOP_WEEK_ANNOUNCEMENT_TOPIC}`));
			// eslint-disable-next-line no-confusing-arrow
			DiscordMQTT.mqttClient.subscribe(MqttConstants.DISCORD_TOP_WEEK_FIGHT_ANNOUNCEMENT_TOPIC, err =>
				err ? console.error(err) : console.log(`Subscribed to topic ${MqttConstants.DISCORD_TOP_WEEK_FIGHT_ANNOUNCEMENT_TOPIC}`));
		});

		DiscordMQTT.mqttClient.on("message", async (topic, message) => {
			if (topic === MqttConstants.DISCORD_TOPIC) {
				// Todo ignore if not the right shard
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
						packet.packet = makePacket(ErrorPacket, {message: `No packet listener found for received packet '${packet.name}'.\n\nData:\n${JSON.stringify(packet.packet)}`});
						listener = DiscordMQTT.packetListener.getListener("ErrorPacket")!;
					}
					await listener(packet.packet, dataJson.context);
				}
			}
			else if (topic === MqttConstants.DISCORD_TOP_WEEK_ANNOUNCEMENT_TOPIC) {
				if (message.toString() === "") {
					console.log("No top week announcement in the MQTT topic");
					return;
				}

				if (await DiscordAnnouncement.canAnnounce()) {
					await DiscordAnnouncement.announceTopWeek(JSON.parse(message.toString()));

					// Clear the announcement so it doesn't get processed again
					DiscordMQTT.mqttClient.publish(MqttConstants.DISCORD_TOP_WEEK_ANNOUNCEMENT_TOPIC, "", { retain: true });
				}
			}
			else if (topic === MqttConstants.DISCORD_TOP_WEEK_FIGHT_ANNOUNCEMENT_TOPIC) {
				if (message.toString() === "") {
					console.log("No top week fight announcement in the MQTT topic");
					return;
				}

				if (await DiscordAnnouncement.canAnnounce()) {
					await DiscordAnnouncement.announceTopWeekFight(JSON.parse(message.toString()));

					// Clear the announcement so it doesn't get processed again
					DiscordMQTT.mqttClient.publish(MqttConstants.DISCORD_TOP_WEEK_FIGHT_ANNOUNCEMENT_TOPIC, "", { retain: true });
				}
			}
		});
	}
}

