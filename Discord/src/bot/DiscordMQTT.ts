import {
	discordConfig, draftBotClient, shardId
} from "./DraftBotShard";
import { PacketListenerClient } from "../../../Lib/src/packets/PacketListener";
import { registerAllPacketHandlers } from "../packetHandlers/PacketHandler";
import {
	DraftBotPacket, makePacket, PacketContext
} from "../../../Lib/src/packets/DraftBotPacket";
import { ErrorPacket } from "../../../Lib/src/packets/commands/ErrorPacket";
import {
	connect, MqttClient
} from "mqtt";
import { MqttConstants } from "../../../Lib/src/constants/MqttConstants";
import { DiscordAnnouncement } from "../announcements/DiscordAnnouncement";
import { NotificationsHandler } from "../notifications/NotificationsHandler";
import { NotificationsSerializedPacket } from "../../../Lib/src/packets/notifications/NotificationsSerializedPacket";
import { LANGUAGE } from "../../../Lib/src/Language";
import { TextChannel } from "discord.js";
import { DraftBotEmbed } from "../messages/DraftBotEmbed";
import i18n from "../translations/i18n";
import { MqttTopicUtils } from "../../../Lib/src/utils/MqttTopicUtils";
import { DraftBotDiscordMetrics } from "./DraftBotDiscordMetrics";
import { millisecondsToSeconds } from "../../../Lib/src/utils/TimeUtils";
import { DraftBotLogger } from "../../../Lib/src/logs/Logger";


const DEFAULT_MQTT_CLIENT_OPTIONS = {
	connectTimeout: MqttConstants.CONNECTION_TIMEOUT
};

export class DiscordMQTT {
	static globalMqttClient: MqttClient;

	static notificationMqttClient: MqttClient;

	static topWeekAnnouncementMqttClient: MqttClient;

	static topWeekFightAnnouncementMqttClient: MqttClient;

	static packetListener: PacketListenerClient = new PacketListenerClient();

	static async init(isMainShard: boolean): Promise<void> {
		await registerAllPacketHandlers();

		this.connectSubscribeAndHandleGlobal();
		this.connectSubscribeAndHandleTopWeekAnnouncement();
		this.connectSubscribeAndHandleTopWeekFightAnnouncement();

		if (isMainShard) {
			this.connectSubscribeAndHandleNotifications();
		}
	}

	private static handleGlobalMqttMessage(): void {
		DiscordMQTT.globalMqttClient.on("message", async (_topic, message) => {
			const messageString = message.toString();
			if (messageString === "") {
				return;
			}

			const dataJson = JSON.parse(messageString);
			DraftBotLogger.debug("Received global message", { packet: dataJson });
			if (!Object.hasOwn(dataJson, "packets") || !Object.hasOwn(dataJson, "context")) {
				DraftBotLogger.error("Wrong packet format", { packet: messageString });
				return;
			}

			const context = dataJson.context as PacketContext;

			for (const packet of dataJson.packets) {
				try {
					DraftBotDiscordMetrics.incrementPacketCount(packet.name);
					let listener = DiscordMQTT.packetListener.getListener(packet.name);
					if (!listener) {
						packet.packet = makePacket(ErrorPacket, { message: `No packet listener found for received packet '${packet.name}'.\n\nData:\n${JSON.stringify(packet.packet)}` });
						listener = DiscordMQTT.packetListener.getListener("ErrorPacket")!;
					}
					const startTime = Date.now();
					await listener(context as PacketContext, packet.packet as DraftBotPacket);
					DraftBotDiscordMetrics.observePacketTime(packet.name, millisecondsToSeconds(Date.now() - startTime));
				}
				catch (error) {
					DraftBotLogger.errorWithObj("Error while handling packet", error);
					DraftBotDiscordMetrics.incrementPacketErrorCount(packet.name);

					const context = dataJson.context as PacketContext;
					const lng = context.discord?.language ?? LANGUAGE.ENGLISH;
					if (context.discord?.channel) {
						const channel = await draftBotClient.channels.fetch(context.discord.channel);
						if (channel instanceof TextChannel) {
							await channel.send({ embeds: [
								new DraftBotEmbed()
									.setErrorColor()
									.setTitle(i18n.t("error:errorOccurredTitle", { lng }))
									.setDescription(i18n.t("error:errorOccurred", { lng }))
							] });
						}
					}
				}
			}
		});
	}

	private static handleTopWeekAnnouncementMqttMessage(): void {
		DiscordMQTT.topWeekAnnouncementMqttClient.on("message", async (_topic, message) => {
			if (message.toString() === "") {
				DraftBotLogger.debug("No top week announcement in the MQTT topic");
				return;
			}

			if (await DiscordAnnouncement.canAnnounce()) {
				await DiscordAnnouncement.announceTopWeek(JSON.parse(message.toString()));

				// Clear the announcement so it doesn't get processed again
				DiscordMQTT.topWeekAnnouncementMqttClient.publish(MqttTopicUtils.getDiscordTopWeekAnnouncementTopic(discordConfig.PREFIX), "", { retain: true });
			}
		});
	}

	private static handleTopWeekFightAnnouncementMqttMessage(): void {
		DiscordMQTT.topWeekFightAnnouncementMqttClient.on("message", async (_topic, message) => {
			if (message.toString() === "") {
				DraftBotLogger.debug("No top week fight announcement in the MQTT topic");
				return;
			}

			if (await DiscordAnnouncement.canAnnounce()) {
				await DiscordAnnouncement.announceTopWeekFight(JSON.parse(message.toString()));

				// Clear the announcement so it doesn't get processed again
				DiscordMQTT.topWeekFightAnnouncementMqttClient.publish(MqttTopicUtils.getDiscordTopWeekFightAnnouncementTopic(discordConfig.PREFIX), "", { retain: true });
			}
		});
	}

	private static handleNotificationMqttMessage(): void {
		DiscordMQTT.notificationMqttClient.on("message", (_topic, message) => {
			if (message.toString() === "") {
				return;
			}

			const messageString = message.toString();

			const serializedPacket: NotificationsSerializedPacket = JSON.parse(messageString);
			DraftBotLogger.debug("Received notification message", { packet: serializedPacket });
			NotificationsHandler.sendNotifications(serializedPacket);
		});
	}

	private static subscribeTo(mqttClient: MqttClient, topic: string, cleanBefore: boolean): void {
		if (cleanBefore) {
			mqttClient.publish(topic, "", { retain: true }); // Clear the last message to avoid processing it twice
		}

		mqttClient.subscribe(topic, err => {
			if (err) {
				DraftBotLogger.errorWithObj(`Error while subscribing to topic ${topic}`, err);
				process.exit(1);
			}
			else {
				DraftBotLogger.info(`Subscribed to topic ${topic}`);
			}
		});
	}

	private static connectSubscribeAndHandleGlobal(): void {
		DiscordMQTT.globalMqttClient = connect(discordConfig.MQTT_HOST, DEFAULT_MQTT_CLIENT_OPTIONS);

		DiscordMQTT.globalMqttClient.on("connect", () => {
			DiscordMQTT.subscribeTo(DiscordMQTT.globalMqttClient, MqttTopicUtils.getDiscordTopic(discordConfig.PREFIX, shardId), true);
		});

		this.handleGlobalMqttMessage();
	}

	private static connectSubscribeAndHandleTopWeekAnnouncement(): void {
		DiscordMQTT.topWeekAnnouncementMqttClient = connect(discordConfig.MQTT_HOST, DEFAULT_MQTT_CLIENT_OPTIONS);

		DiscordMQTT.topWeekAnnouncementMqttClient.on("connect", () => {
			DiscordMQTT.subscribeTo(DiscordMQTT.topWeekAnnouncementMqttClient, MqttTopicUtils.getDiscordTopWeekAnnouncementTopic(discordConfig.PREFIX), false);
		});

		this.handleTopWeekAnnouncementMqttMessage();
	}

	private static connectSubscribeAndHandleTopWeekFightAnnouncement(): void {
		DiscordMQTT.topWeekFightAnnouncementMqttClient = connect(discordConfig.MQTT_HOST, DEFAULT_MQTT_CLIENT_OPTIONS);

		DiscordMQTT.topWeekFightAnnouncementMqttClient.on("connect", () => {
			DiscordMQTT.subscribeTo(DiscordMQTT.topWeekFightAnnouncementMqttClient, MqttTopicUtils.getDiscordTopWeekFightAnnouncementTopic(discordConfig.PREFIX), false);
		});

		this.handleTopWeekFightAnnouncementMqttMessage();
	}

	private static connectSubscribeAndHandleNotifications(): void {
		DiscordMQTT.notificationMqttClient = connect(discordConfig.MQTT_HOST, {
			...DEFAULT_MQTT_CLIENT_OPTIONS,
			clientId: MqttTopicUtils.getNotificationsConsumerId(discordConfig.PREFIX),
			clean: false // Keeps session active even if the client goes offline
		});

		DiscordMQTT.notificationMqttClient.on("connect", () => {
			DiscordMQTT.subscribeTo(DiscordMQTT.notificationMqttClient, MqttTopicUtils.getNotificationsTopic(discordConfig.PREFIX), true);
		});

		this.handleNotificationMqttMessage();
	}
}

