import { NotificationsSerializedPacket } from "../../../Lib/src/packets/notifications/NotificationsSerializedPacket";
import {
	BaseGuildTextChannel, TextChannel, User
} from "discord.js";
import { DraftBotEmbed } from "../messages/DraftBotEmbed";
import i18n from "../translations/i18n";
import { Language } from "../../../Lib/src/Language";
import { NotificationSendTypeEnum } from "./NotificationSendType";
import {
	draftBotClient, keycloakConfig
} from "../bot/DraftBotShard";
import { getMention } from "../../../Lib/src/utils/StringUtils";
import {
	NotificationsTypes, NotificationType
} from "./NotificationType";
import NotificationsConfiguration, { NotificationsConfigurations } from "../database/discord/models/NotificationsConfiguration";
import { ReachDestinationNotificationPacket } from "../../../Lib/src/packets/notifications/ReachDestinationNotificationPacket";
import { KeycloakUtils } from "../../../Lib/src/keycloak/KeycloakUtils";
import { DisplayUtils } from "../utils/DisplayUtils";
import { GuildDailyNotificationPacket } from "../../../Lib/src/packets/notifications/GuildDailyNotificationPacket";
import { getCommandGuildDailyRewardPacketString } from "../commands/guild/GuildDailyCommand";
import { DraftBotLogger } from "../../../Lib/src/logs/DraftBotLogger";
import { escapeUsername } from "../utils/StringUtils";

export abstract class NotificationsHandler {
	/**
	 * This function is called to send a batch of notifications
	 * @param notificationSerializedPacket
	 */
	static sendNotifications(notificationSerializedPacket: NotificationsSerializedPacket): void {
		for (const notification of notificationSerializedPacket.notifications) {
			const keycloakId = notification.packet.keycloakId;

			KeycloakUtils.getUserByKeycloakId(keycloakConfig, keycloakId).then(async keycloakUser => {
				if (keycloakUser && keycloakUser.attributes.discordId) {
					const discordId = keycloakUser.attributes.discordId[0];
					const lng = keycloakUser.attributes.language[0];

					let notificationContent: string;
					let notificationType: NotificationType;

					switch (notification.type) {
						case ReachDestinationNotificationPacket.name: {
							const packet = notification.packet as ReachDestinationNotificationPacket;
							notificationContent = i18n.t("bot:notificationReachDestination", {
								lng,
								destination: DisplayUtils.getMapLocationDisplay(packet.mapType, packet.mapId, lng)
							});
							notificationType = NotificationsTypes.REPORT;
							break;
						}
						case GuildDailyNotificationPacket.name: {
							const packet = notification.packet as GuildDailyNotificationPacket;
							notificationContent = i18n.t("bot:notificationGuildDaily", {
								lng,
								pseudo: escapeUsername((await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.keycloakIdOfExecutor))!.attributes.gameUsername[0]),
								rewards: getCommandGuildDailyRewardPacketString((notification.packet as GuildDailyNotificationPacket).reward, lng)
							});
							notificationType = NotificationsTypes.GUILD_DAILY;
							break;
						}
						default:
							throw "Unknown notification type: " + notification.type;
					}

					draftBotClient.users.fetch(discordId).then(async discordUser => {
						await NotificationsHandler.sendNotification(
							discordUser,
							await NotificationsConfigurations.getOrRegister(discordId),
							notificationType,
							i18n.t(notificationContent, { lng }),
							lng
						);
					});
				}
				else {
					throw `Keycloak user with id ${keycloakId} not found or missing discordId`;
				}
			});
		}
	}

	/**
	 * This function is called to send a notification to a user
	 * @param user
	 * @param notificationConfiguration
	 * @param notificationType
	 * @param content
	 * @param lng
	 */
	static async sendNotification(
		user: User,
		notificationConfiguration: NotificationsConfiguration,
		notificationType: NotificationType,
		content: string,
		lng: Language
	): Promise<void> {
		const notificationTypeValue = notificationType.value(notificationConfiguration);

		if (!notificationTypeValue.enabled) {
			return;
		}

		switch (notificationTypeValue.sendType) {
			case NotificationSendTypeEnum.DM:
				await NotificationsHandler.sendDmNotification(user, content, lng);
				break;
			case NotificationSendTypeEnum.CHANNEL:
				await this.sendChannelNotification(user, notificationConfiguration, notificationType, content, lng);
				break;
			default:
				throw `Unknown sendLocation: ${notificationTypeValue.sendType}`;
		}
	}

	/**
	 * This function is called to get the notification embed
	 * @param user
	 * @param content
	 * @param lng
	 */
	private static getNotificationEmbed(user: User, content: string, lng: Language): DraftBotEmbed {
		return new DraftBotEmbed()
			.formatAuthor(i18n.t("bot:notificationTitle", { lng }), user)
			.setDescription(content)
			.setFooter({ text: i18n.t("bot:notificationFooter", { lng }) });
	}

	/**
	 * This function is called to send a DM notification to a user
	 * @param user
	 * @param content
	 * @param lng
	 */
	static async sendDmNotification(user: User, content: string, lng: Language): Promise<void> {
		const embed = NotificationsHandler.getNotificationEmbed(user, content, lng);
		await user.send({ embeds: [embed] }).catch(e => {
			DraftBotLogger.errorWithObj(`Failed to send DM notification to user ${user.id}`, e);
		});
	}

	/**
	 * This function is called to verify if the bot have access to a channel
	 * @param user
	 * @param notificationConfiguration
	 * @param notificationType
	 * @param content
	 * @param lng
	 */
	static async sendChannelNotification(user: User, notificationConfiguration: NotificationsConfiguration, notificationType: NotificationType, content: string, lng: Language): Promise<void> {
		const embed = NotificationsHandler.getNotificationEmbed(user, content, lng);

		const notificationTypeValue = notificationType.value(notificationConfiguration);

		const channelAccess = await draftBotClient.shard!.broadcastEval((client, context) =>
			client.channels.fetch(context.channel).then(channel => {
				if ((<BaseGuildTextChannel>channel).guild.shardId === client.shard!.ids[0]) {
					(<TextChannel>channel).send(context.embedNotification);
					return true;
				}
				return false;
			})
				.catch(() => false), {
			context: {
				channel: notificationTypeValue.channelId!,
				embedNotification: {
					content: getMention(user.id),
					embeds: [embed]
				}
			}
		});

		if (!channelAccess.includes(true)) {
			notificationType.changeSendTypeCallback(notificationConfiguration, NotificationSendTypeEnum.DM, "");
			await notificationConfiguration.save();

			await NotificationsHandler.sendDmNotification(user, `${content}\n\n${i18n.t("bot:notificationsNoChannelAccess", { lng })}`, lng);
		}
	}
}
