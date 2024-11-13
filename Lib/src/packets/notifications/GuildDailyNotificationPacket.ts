import {NotificationPacket} from "./NotificationPacket";

export class GuildDailyNotificationPacket extends NotificationPacket {
	keycloakIdOfExecutor!: string;
}