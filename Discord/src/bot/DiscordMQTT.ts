import {discordConfig, draftBotClient} from "./DraftBotShard";
import {PacketListenerClient} from "../../../Lib/src/packets/PacketListener";
import {registerAllPacketHandlers} from "../packetHandlers/PacketHandler";
import {makePacket, PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {ErrorPacket} from "../../../Lib/src/packets/commands/ErrorPacket";
import {connect, MqttClient} from "mqtt";
import {MqttConstants} from "../../../Lib/src/constants/MqttConstants";
import {DiscordAnnouncement} from "../announcements/DiscordAnnouncement";
import {NotificationsHandler} from "../notifications/NotificationsHandler";
import {NotificationsSerializedPacket} from "../../../Lib/src/packets/notifications/NotificationsSerializedPacket";
import {LANGUAGE} from "../../../Lib/src/Language";
import {TextChannel} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import i18n from "../translations/i18n";

export class DiscordMQTT {
	static mqttClient: MqttClient;

	static notificationMqttClient: MqttClient;

	static packetListener: PacketListenerClient = new PacketListenerClient();

	static async init(isMainShard: boolean): Promise<void> {
		await registerAllPacketHandlers();

		this.connectAndSubscribeGlobal();

		if (isMainShard) {
			this.connectSubscribeAndHandleNotifications();
		}

		this.handleGlobalMqttMessage();
	}

	private static handleGlobalMqttMessage(): void {
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

				try {
					for (const packet of dataJson.packets) {
						let listener = DiscordMQTT.packetListener.getListener(packet.name);
						if (!listener) {
							packet.packet = makePacket(ErrorPacket, {message: `No packet listener found for received packet '${packet.name}'.\n\nData:\n${JSON.stringify(packet.packet)}`});
							listener = DiscordMQTT.packetListener.getListener("ErrorPacket")!;
						}
						await listener(packet.packet, dataJson.context);
					}
				}
				catch (error) {
					console.error(`Error while handling packet: ${error}`);

					const context = dataJson.context as PacketContext;
					const lng = context.discord?.language ?? LANGUAGE.ENGLISH;
					if (context.discord?.channel) {
						draftBotClient.channels.fetch(context.discord.channel).then(channel => {
							if (channel) {
								(channel as TextChannel).send({ embeds: [
									new DraftBotEmbed()
										.setErrorColor()
										.setTitle(i18n.t("error:errorOccurredTitle", {lng}))
										.setDescription(i18n.t("error:errorOccurred", {lng}))
								]});
							}
						});
					}
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
					DiscordMQTT.mqttClient.publish(MqttConstants.DISCORD_TOP_WEEK_ANNOUNCEMENT_TOPIC, "", {retain: true});
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
					DiscordMQTT.mqttClient.publish(MqttConstants.DISCORD_TOP_WEEK_FIGHT_ANNOUNCEMENT_TOPIC, "", {retain: true});
				}
			}
		});
	}

	private static connectSubscribeAndHandleNotifications(): void {
		DiscordMQTT.notificationMqttClient = connect(discordConfig.MQTT_HOST, {
			clientId: MqttConstants.NOTIFICATIONS_CONSUMER,
			clean: false // Keeps session active even if the client goes offline
		});

		DiscordMQTT.notificationMqttClient.on("connect", () => {
			DiscordMQTT.notificationMqttClient.publish(MqttConstants.NOTIFICATIONS, "", {retain: true}); // Clear the last notification to avoid processing it twice

			// eslint-disable-next-line no-confusing-arrow
			DiscordMQTT.notificationMqttClient.subscribe(MqttConstants.NOTIFICATIONS, {qos: 2}, err =>
				err ? console.error(err) : console.log(`Subscribed to topic ${MqttConstants.NOTIFICATIONS}`));
		});

		DiscordMQTT.notificationMqttClient.on("message", (topic, message) => {
			if (topic === MqttConstants.NOTIFICATIONS) {
				if (message.toString() === "") {
					return;
				}

				const messageString = message.toString();
				console.log(`Received notification message from topic ${topic}: ${messageString}`);

				const serializedPacket: NotificationsSerializedPacket = JSON.parse(messageString);
				NotificationsHandler.sendNotifications(serializedPacket);
			}
		});
	}

	private static connectAndSubscribeGlobal(): void {
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
	}
}

