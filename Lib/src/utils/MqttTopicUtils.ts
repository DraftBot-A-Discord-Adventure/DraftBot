export abstract class MqttTopicUtils {
	private static readonly CORE_TOPIC = "draftbot_core";

	private static readonly DISCORD_TOPIC = "draftbot_discord/shard";

	private static readonly DISCORD_TOP_WEEK_ANNOUNCEMENT_TOPIC = "draftbot_discord_top_week_announcement";

	private static readonly DISCORD_TOP_WEEK_FIGHT_ANNOUNCEMENT_TOPIC = "draftbot_discord_top_week_fight_announcement";

	private static readonly NOTIFICATIONS = "draftbot_notifications";

	private static readonly NOTIFICATIONS_CONSUMER = "notifications-consumer";

	private static readonly DISCORD_SHARD_MANAGER_TOPIC = "discord_shard_manager";


	static getCoreTopic(prefix: string): string {
		return `${prefix}/${MqttTopicUtils.CORE_TOPIC}`;
	}

	static getDiscordTopic(prefix: string, shardId: number): string {
		return `${prefix}/${MqttTopicUtils.DISCORD_TOPIC}/${shardId}`;
	}

	static getDiscordTopWeekAnnouncementTopic(prefix: string): string {
		return `${prefix}/${MqttTopicUtils.DISCORD_TOP_WEEK_ANNOUNCEMENT_TOPIC}`;
	}

	static getDiscordTopWeekFightAnnouncementTopic(prefix: string): string {
		return `${prefix}/${MqttTopicUtils.DISCORD_TOP_WEEK_FIGHT_ANNOUNCEMENT_TOPIC}`;
	}

	static getNotificationsTopic(prefix: string): string {
		return `${prefix}/${MqttTopicUtils.NOTIFICATIONS}`;
	}

	static getNotificationsConsumerId(prefix: string): string {
		return `${prefix}/${MqttTopicUtils.NOTIFICATIONS_CONSUMER}`;
	}

	static getDiscordShardManagerTopic(prefix: string): string {
		return `${prefix}/${MqttTopicUtils.DISCORD_SHARD_MANAGER_TOPIC}`;
	}
}
