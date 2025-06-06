import { NotificationPacket } from "./NotificationPacket";

export class GuildKickNotificationPacket extends NotificationPacket {
	guildName!: string;
}
